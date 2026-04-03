import React, { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../store";
import { PageHeader, Card, Btn, Modal, Field, SField, Pagination, ConfirmModal, ImageUpload } from "../components/ui";
import { Plus, Search, Camera, Image as ImageIcon, AlertTriangle, Eye, Edit2, Trash2, Download } from "lucide-react";
import { Inward } from "../types";
import { genId, todayStr } from "../utils";
import { PROJECTS, CATEGORIES } from "../data";
import { toast } from "react-hot-toast";

const INITIAL_INWARD: Partial<Inward> = {
  sku: "",
  name: "",
  qty: 0,
  unit: "",
  challanNo: "",
  mrNo: "",
  supplier: "",
  type: "Manual",
  project: "",
  category: "",
  materialPhotoUrl: "",
  personPhotoUrl: "",
};

export const InwardPage = () => {
  const { 
    inwards, 
    inwardsPagination,
    fetchResource,
    addInward, 
    deleteInward,
    inventory, 
    updateInventory, 
    vendors, 
    role, 
    uploadImage,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    // Use silent: true if we already have data to prevent "faltu loader"
    const isInitialLoad = inwards.length === 0;
    fetchResource('inward', 1, 50, !isInitialLoad);
  }, [fetchResource]);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedInward, setSelectedInward] = useState<Inward | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newInward, setNewInward] = useState<Partial<Inward>>(INITIAL_INWARD);
  const [searchItem, setSearchItem] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const validateForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.sku) newErrors.sku = "Item selection is required";
    if (!data.project) newErrors.project = "Project is required";
    if (!data.category) newErrors.category = "Category is required";
    if (!data.qty || data.qty <= 0) newErrors.qty = "Valid quantity is required";
    if (!data.supplier) newErrors.supplier = "Supplier is required";
    if (!data.challanNo) newErrors.challanNo = "Challan/Invoice No. is required";
    if (!data.mrNo) newErrors.mrNo = "MR No. is required";
    if (!data.materialPhotoUrl) newErrors.materialPhotoUrl = "Material photo is required";
    if (!data.personPhotoUrl) newErrors.personPhotoUrl = "Challan/Invoice photo is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePageChange = useCallback((page: number) => {
    fetchResource('inward', page);
  }, [fetchResource]);

  const [loadingField, setLoadingField] = useState<string | null>(null);

  const handleMaterialPhoto = async (file: File) => {
    setLoadingField("material");
    try {
      const { url } = await uploadImage(file);
      setNewInward(prev => ({ ...prev, materialPhotoUrl: url }));
      toast.success("Material photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handlePersonPhoto = async (file: File) => {
    setLoadingField("person");
    try {
      const { url } = await uploadImage(file);
      setNewInward(prev => ({ ...prev, personPhotoUrl: url }));
      toast.success("Person photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleCreate = async () => {
    if (!validateForm(newInward)) {
      return;
    }

    // Find the max ID to avoid duplicates
    const maxIdNum = inwards.reduce((max, inw) => {
      const parts = inw.id.split("-");
      const num = parseInt(parts[parts.length - 1] || "0");
      return num > max ? num : max;
    }, 0);

    const inward: Inward = {
      id: genId("INW", maxIdNum),
      sku: newInward.sku!,
      name: newInward.name!,
      qty: Number(newInward.qty!),
      unit: newInward.unit!,
      date: todayStr(),
      challanNo: newInward.challanNo!,
      mrNo: newInward.mrNo!,
      supplier: newInward.supplier!,
      type: "Manual",
      project: newInward.project,
      category: newInward.category,
      materialPhotoUrl: newInward.materialPhotoUrl,
      personPhotoUrl: newInward.personPhotoUrl,
    };

    const inv = inventory.find((i) => i.sku === inward.sku);
    
    try {
      await addInward(inward);
      if (inv) {
        await updateInventory(inward.sku, {
          liveStock: inv.liveStock + inward.qty,
        });
      }
      setModal(false);
      setSearchItem("");
      setNewInward(INITIAL_INWARD);
      setErrors({});
    } catch (error: any) {
      setErrors({ form: `Failed to record inward: ${error.message}` });
    } finally {
      setModal(false);
      setSearchItem("");
      setNewInward(INITIAL_INWARD);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteInward(deleteConfirm);
      setDeleteConfirm(null);
    } catch (error: any) {
      // Error handled in store
    }
  };

  const selectItem = (item: any) => {
    setNewInward({
      ...newInward,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      project: item.lastProject || "",
      category: item.category || "",
    });
    setSearchItem("");
  };

  const TableSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {[...Array(6)].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-gray-200 dark:border-gray-800">
                {[...Array(6)].map((_, j) => (
                  <td key={j} className="px-4 py-4">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inward Transactions"
        sub="Record of all materials received"
        actions={
          ["Super Admin", "Director", "Store Incharge"].includes(role || "") && (
            <Btn
              label="Manual Inward"
              icon={Plus}
              onClick={() => setModal(true)}
            />
          )
        }
      />

      <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          {loading && inwards.length === 0 ? (
            <TableSkeleton />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    Challan / Invoice
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    Photos
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
                {inwards.map((inw) => (
                  <tr key={inw.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                      {inw.date}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#1A1A2E] dark:text-white">
                      {inw.name}{" "}
                      <span className="text-[11px] text-[#6B7280] dark:text-gray-500 block font-mono">
                        {inw.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-right text-[#10B981] dark:text-emerald-400">
                      +{inw.qty} {inw.unit}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                      {inw.supplier}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                      {inw.challanNo} / {inw.mrNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {inw.materialPhotoUrl && (
                          <div 
                            className="w-8 h-8 rounded border border-[#E8ECF0] dark:border-gray-700 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setPreviewImage(inw.materialPhotoUrl!)}
                            title="Material Photo"
                          >
                            <img src={inw.materialPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {inw.personPhotoUrl && (
                          <div 
                            className="w-8 h-8 rounded border border-[#E8ECF0] dark:border-gray-700 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setPreviewImage(inw.personPhotoUrl!)}
                            title="Challan / Invoice Photo"
                          >
                            <img src={inw.personPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] font-bold px-2 py-1 rounded-full ${inw.type === "GRN" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"}`}
                      >
                        {inw.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Btn
                        icon={Eye}
                        small
                        outline
                        onClick={() => {
                          setSelectedInward(inw);
                          setViewModal(true);
                        }}
                        title="View"
                      />
                      {role === "Super Admin" && (
                        <>
                          <Btn
                            icon={Edit2}
                            small
                            outline
                            onClick={() => {
                              setNewInward(inw);
                              setModal(true);
                            }}
                            title="Edit"
                          />
                          <Btn
                            icon={Trash2}
                            small
                            outline
                            color="red"
                            onClick={() => setDeleteConfirm(inw.id)}
                            title="Delete"
                          />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {inwards.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-[13px]"
                    >
                      No inward transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {inwardsPagination && (
        <Pagination
          data={inwardsPagination}
          onPageChange={handlePageChange}
        />
      )}

      {viewModal && selectedInward && (
        <Modal
          title={`Inward Report: ${selectedInward.id}`}
          wide
          onClose={() => setViewModal(false)}
        >
          <div className="space-y-8 p-2">
            {/* Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedInward.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Supplier</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedInward.supplier}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Project</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedInward.project}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Type</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedInward.type}</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Challan No.</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">MR No.</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    <tr className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-3 text-[12px] font-mono text-gray-500 dark:text-gray-400">{selectedInward.sku}</td>
                      <td className="px-4 py-3 text-[13px] font-bold text-gray-900 dark:text-white">{selectedInward.name}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-300">{selectedInward.challanNo}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-300">{selectedInward.mrNo}</td>
                      <td className="px-4 py-3 text-[13px] text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{selectedInward.qty} {selectedInward.unit}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Photos if available */}
            {(selectedInward.materialPhotoUrl || selectedInward.personPhotoUrl) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedInward.materialPhotoUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Material Photo</p>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <img 
                        src={selectedInward.materialPhotoUrl} 
                        className="w-full h-64 object-contain" 
                        referrerPolicy="no-referrer" 
                        alt="Material"
                      />
                    </div>
                  </div>
                )}
                {selectedInward.personPhotoUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Challan / Invoice Photo</p>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <img 
                        src={selectedInward.personPhotoUrl} 
                        className="w-full h-64 object-contain" 
                        referrerPolicy="no-referrer" 
                        alt="Challan / Invoice"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Btn label="Close" outline onClick={() => setViewModal(false)} />
              <Btn label="Download PDF" icon={Download} onClick={() => {/* TODO: Implement Inward PDF */}} />
            </div>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal 
          title="Manual Inward" 
          onClose={() => {
            setModal(false);
            setSearchItem("");
            setErrors({});
            setNewInward(INITIAL_INWARD);
          }}
        >
          <div className="space-y-4">
            {errors.form && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-[13px]">
                {errors.form}
              </div>
            )}
            <div className="relative mb-4">
              <label className="block text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-1">
                Select Item *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg text-[13px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#F97316] ${errors.sku ? "border-red-500" : "border-[#E8ECF0] dark:border-gray-700"}`}
                />
              </div>
              {errors.sku && (
                <p className="text-[11px] text-red-500 mt-1">{errors.sku}</p>
              )}
              {searchItem && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-[#E8ECF0] dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {inventory
                    .filter((i) =>
                      i.name.toLowerCase().includes(searchItem.toLowerCase()),
                    )
                    .map((i) => (
                      <div
                        key={i.sku}
                        onClick={() => selectItem(i)}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-[13px] flex justify-between items-center"
                      >
                        <span className="text-gray-900 dark:text-white">{i.name} ({i.sku})</span>
                        <span className="font-bold text-[#10B981] dark:text-emerald-400">
                          {i.liveStock} {i.unit}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {newInward.sku && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-[#E8ECF0] dark:border-gray-700 rounded-lg mb-4">
                <p className="text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase">
                  Selected Item
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {newInward.name} ({newInward.sku})
                  </p>
                  <p className="text-[13px] font-bold text-[#10B981] dark:text-emerald-400">
                    Available: {inventory.find(i => i.sku === newInward.sku)?.liveStock} {newInward.unit}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SField
                label="Project"
                value={newInward.project}
                onChange={(e: any) => setNewInward(prev => ({ ...prev, project: e.target.value }))}
                options={PROJECTS}
                required
                error={errors.project}
              />
              <SField
                label="Category"
                value={newInward.category}
                onChange={(e: any) => setNewInward(prev => ({ ...prev, category: e.target.value }))}
                options={CATEGORIES}
                required
                error={errors.category}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Quantity Received"
                type="number"
                value={newInward.qty}
                onChange={(e: any) =>
                  setNewInward(prev => ({ ...prev, qty: e.target.value }))
                }
                required
                error={errors.qty}
              />
              <SField
                label="Supplier"
                value={newInward.supplier}
                onChange={(e: any) =>
                  setNewInward(prev => ({ ...prev, supplier: e.target.value }))
                }
                options={vendors.map((v) => v.name)}
                required
                error={errors.supplier}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Challan / Invoice No."
                value={newInward.challanNo}
                onChange={(e: any) =>
                  setNewInward(prev => ({ ...prev, challanNo: e.target.value }))
                }
                required
                error={errors.challanNo}
              />
              <Field
                label="Material Receipt (MR) No."
                value={newInward.mrNo}
                onChange={(e: any) =>
                  setNewInward(prev => ({ ...prev, mrNo: e.target.value }))
                }
                required
                error={errors.mrNo}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUpload
                label="Material Photo *"
                id="material-photo-inw"
                value={newInward.materialPhotoUrl}
                onChange={handleMaterialPhoto}
                loading={loadingField === "material"}
                error={errors.materialPhotoUrl}
              />
              <ImageUpload
                label="Challan / Invoice Photo *"
                id="challan-photo-inw"
                value={newInward.personPhotoUrl}
                onChange={handlePersonPhoto}
                loading={loadingField === "person"}
                error={errors.personPhotoUrl}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Btn 
                label="Cancel" 
                outline 
                onClick={() => {
                  setModal(false);
                  setSearchItem("");
                  setErrors({});
                  setNewInward(INITIAL_INWARD);
                }} 
              />
              <Btn
                label={loading ? "Processing..." : "Confirm Inward"}
                onClick={handleCreate}
                loading={actionLoading}
                color="green"
              />
            </div>
          </div>
        </Modal>
      )}

      {previewImage && (
        <Modal title="Image Preview" onClose={() => setPreviewImage(null)}>
          <div className="flex justify-center items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[70vh] rounded-lg shadow-xl" 
            />
          </div>
          <div className="flex justify-end mt-4">
            <Btn label="Close" outline onClick={() => setPreviewImage(null)} />
          </div>
        </Modal>
      )}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Inward Record"
          message="Are you sure you want to delete this inward record? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

import React, { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../store";
import {
  PageHeader,
  Card,
  StatusBadge,
  Btn,
  Modal,
  Field,
  SField,
  Pagination,
  ConfirmModal,
  ImageUpload,
} from "../components/ui";
import { Plus, Camera, FileUp, X, Eye, Edit2, Trash2, Download } from "lucide-react";
import { GRN, GRNItem, Inward } from "../types";
import { genId, todayStr } from "../utils";

export const GRNPage = () => {
  const {
    grns,
    grnsPagination,
    fetchResource,
    addGRN,
    updateGRN,
    deleteGRN,
    updatePO,
    pos,
    inventory,
    updateInventory,
    addInward,
    role,
    uploadImage,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    fetchResource('grn', 1);
  }, [fetchResource]);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const validateForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.poId) newErrors.poId = "PO selection is required";
    if (!data.challan) newErrors.challan = "Challan/Invoice No. is required";
    if (!data.mrNo) newErrors.mrNo = "MR No. is required";
    if (!data.docType) newErrors.docType = "Document Type is required";
    if (!data.items || data.items.length === 0) newErrors.items = "At least one item is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [newGRN, setNewGRN] = useState<Partial<GRN>>({
    poId: "",
    challan: "",
    mrNo: "",
    docType: "Challan",
    items: [],
  });

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteGRN(deleteConfirm);
      setDeleteConfirm(null);
    } catch (error: any) {
      // Error handled in store
    }
  };

  const handlePageChange = useCallback((page: number) => {
    fetchResource('grn', page);
  }, [fetchResource]);

  const approvedPOs = pos.filter((p) => p.status === "Approved" || p.status === "Pending");
  const canEdit = ["Super Admin", "Director", "Store Incharge"].includes(role || "");

  const handlePOSelect = (poId: string) => {
    const po = pos.find((p) => p.id === poId);
    if (!po) return;

    const items: GRNItem[] = po.items.map((i) => ({
      sku: i.sku,
      name: i.name,
      ordered: i.qty,
      received: i.qty,
      variance: 0,
    }));

    setNewGRN({
      ...newGRN,
      poId,
      project: po.project,
      vendor: po.vendor,
      items,
    });
  };

  const [loadingField, setLoadingField] = useState<string | null>(null);

  const handleFileChange = async (
    file: File,
    field: "materialImageUrl" | "challanImageUrl"
  ) => {
    setLoadingField(field);
    try {
      const { url } = await uploadImage(file);
      setNewGRN({ ...newGRN, [field]: url });
    } catch (error: any) {
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const updateItem = (index: number, received: number) => {
    const items = [...(newGRN.items || [])];
    const item = { ...items[index], received };
    item.variance = item.received - item.ordered;
    items[index] = item;
    setNewGRN({ ...newGRN, items });
  };

  const handleCreate = async () => {
    if (!validateForm(newGRN)) {
      return;
    }

    if (isEditing && newGRN.id) {
      try {
        await updateGRN(newGRN.id, newGRN);
        setModal(false);
        setNewGRN({
          poId: "",
          challan: "",
          mrNo: "",
          docType: "Challan",
          items: [],
        });
        setIsEditing(false);
        setErrors({});
      } catch (error: any) {
        alert(`Failed to update GRN: ${error.message}`);
      }
      return;
    }

    // Find the max ID to avoid duplicates
    const maxIdNum = grns.reduce((max, g) => {
      const parts = g.id.split("-");
      const num = parseInt(parts[parts.length - 1] || "0");
      return num > max ? num : max;
    }, 0);

    const grnId = genId("GRN", maxIdNum);
    const grn: GRN = {
      id: grnId,
      poId: newGRN.poId!,
      project: newGRN.project!,
      vendor: newGRN.vendor!,
      date: todayStr(),
      challan: newGRN.challan!,
      mrNo: newGRN.mrNo!,
      docType: newGRN.docType as any,
      items: newGRN.items!,
      status: "Confirmed",
      materialImageUrl: newGRN.materialImageUrl,
      challanImageUrl: newGRN.challanImageUrl,
    };

    try {
      // Create GRN - Backend handles inventory, inward, and PO status updates
      await addGRN(grn);

      setModal(false);
      setNewGRN({
        poId: "",
        challan: "",
        mrNo: "",
        docType: "Challan",
        items: [],
        materialImageUrl: undefined,
        challanImageUrl: undefined,
      });
      setErrors({});
    } catch (error: any) {
      alert(`Failed to create GRN: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Receipt Note (GRN)"
        sub="Receive materials against approved POs"
        actions={
          canEdit && (
            <Btn
              label="Create GRN"
              icon={Plus}
              onClick={() => {
                setNewGRN({
                  poId: "",
                  challan: "",
                  mrNo: "",
                  docType: "Challan",
                  items: [],
                });
                setIsEditing(false);
                setModal(true);
              }}
            />
          )
        }
      />

      <Card className="p-0 overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  GRN No.
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  PO Ref
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Images
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
              {grns.map((grn) => (
                <tr key={grn.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {grn.id}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {grn.date}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {grn.poId}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {grn.vendor}
                  </td>
                  <td className={`px-4 py-3 text-[13px] font-bold ${grn.items.some(i => i.variance !== 0) ? "text-red-500" : "text-green-500"}`}>
                    {grn.items.reduce((sum, i) => sum + i.variance, 0)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {grn.materialImageUrl && (
                        <div
                          className="w-8 h-8 rounded overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewImage(grn.materialImageUrl!)}
                        >
                          <img
                            src={grn.materialImageUrl}
                            alt="Material"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      {grn.challanImageUrl && (
                        <div
                          className="w-8 h-8 rounded overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewImage(grn.challanImageUrl!)}
                        >
                          <img
                            src={grn.challanImageUrl}
                            alt="Challan"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={grn.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Btn
                      icon={Eye}
                      small
                      outline
                      onClick={() => {
                        setSelectedGRN(grn);
                        setViewModal(true);
                      }}
                      title="View"
                    />
                    {canEdit && (
                      <>
                        <Btn
                          icon={Edit2}
                          small
                          outline
                          onClick={() => {
                            setNewGRN(grn);
                            setIsEditing(true);
                            setModal(true);
                          }}
                          title="Edit"
                        />
                        <Btn
                          icon={Trash2}
                          small
                          outline
                          color="red"
                          onClick={() => setDeleteConfirm(grn.id)}
                          title="Delete"
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {grns.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 text-[13px]"
                  >
                    No GRNs created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {grnsPagination && (
        <Pagination
          data={grnsPagination}
          onPageChange={handlePageChange}
        />
      )}

      {viewModal && selectedGRN && (
        <Modal
          title={`GRN Report: ${selectedGRN.id}`}
          wide
          onClose={() => setViewModal(false)}
        >
          <div className="space-y-8 p-2">
            {/* Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedGRN.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Vendor</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedGRN.vendor}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Project</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedGRN.project}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Items</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedGRN.items.length}</p>
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
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Ordered</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Received</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {selectedGRN.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-4 py-3 text-[12px] font-mono text-gray-500 dark:text-gray-400">{item.sku}</td>
                        <td className="px-4 py-3 text-[13px] font-bold text-gray-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-3 text-[13px] text-right text-gray-600 dark:text-gray-300">{item.ordered}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{item.received}</td>
                        <td className={`px-4 py-3 text-[13px] text-right font-bold ${item.variance < 0 ? "text-red-500" : item.variance > 0 ? "text-blue-500" : "text-gray-400"}`}>
                          {item.variance > 0 ? `+${item.variance}` : item.variance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Photos if available */}
            {(selectedGRN.materialImageUrl || selectedGRN.challanImageUrl) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {selectedGRN.materialImageUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Material Photo</p>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <img 
                        src={selectedGRN.materialImageUrl} 
                        className="w-full h-64 object-contain" 
                        referrerPolicy="no-referrer" 
                        alt="Material"
                      />
                    </div>
                  </div>
                )}
                {selectedGRN.challanImageUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Challan Photo</p>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <img 
                        src={selectedGRN.challanImageUrl} 
                        className="w-full h-64 object-contain" 
                        referrerPolicy="no-referrer" 
                        alt="Challan"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Btn label="Close" outline onClick={() => setViewModal(false)} />
              <Btn label="Download PDF" icon={Download} onClick={() => {/* TODO: Implement GRN PDF */}} />
            </div>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal
          title={isEditing ? "Edit GRN" : "Create GRN"}
          wide
          onClose={() => {
            setModal(false);
            setErrors({});
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <SField
              label="Select Approved PO"
              value={newGRN.poId}
              onChange={(e: any) => handlePOSelect(e.target.value)}
              options={approvedPOs.map((p) => ({
                value: p.id,
                label: `${p.id} - ${p.vendor}`,
              }))}
              required
              error={errors.poId}
            />
            <SField
              label="Document Type"
              value={newGRN.docType}
              onChange={(e: any) =>
                setNewGRN({ ...newGRN, docType: e.target.value })
              }
              options={[
                "Challan",
                "Invoice",
                "Bilty",
                "Gate Pass",
                "Without Challan",
                "Without Gate Pass",
              ]}
              required
              error={errors.docType}
            />
            <Field
              label="Challan / Invoice No."
              value={newGRN.challan}
              onChange={(e: any) =>
                setNewGRN({ ...newGRN, challan: e.target.value })
              }
              required
              error={errors.challan}
            />
            <Field
              label="Material Receipt (MR) No."
              value={newGRN.mrNo}
              onChange={(e: any) =>
                setNewGRN({ ...newGRN, mrNo: e.target.value })
              }
              required
              error={errors.mrNo}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUpload
                label="Material Image"
                id="materialImageUrl"
                value={newGRN.materialImageUrl}
                onChange={(file) => handleFileChange(file, "materialImageUrl")}
                loading={loadingField === "materialImageUrl"}
              />
              <ImageUpload
                label="Challan / Invoice Image"
                id="challanImageUrl"
                value={newGRN.challanImageUrl}
                onChange={(file) => handleFileChange(file, "challanImageUrl")}
                loading={loadingField === "challanImageUrl"}
              />
            </div>
          </div>

          {newGRN.items && newGRN.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[13px] font-bold text-[#1A1A2E] dark:text-white mb-3">
                Receipt Items
              </h3>
              {errors.items && (
                <p className="text-[11px] text-red-500 mb-2">{errors.items}</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse mb-4">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                      <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase min-w-[150px]">
                        Item
                      </th>
                      <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase text-right w-24">
                        Ordered
                      </th>
                      <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase text-right w-24">
                        Received
                      </th>
                      <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase text-right w-24">
                        Variance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
                    {newGRN.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-2 text-[13px] dark:text-gray-300">{item.name}</td>
                        <td className="px-2 py-2 text-[13px] font-medium text-right dark:text-gray-300">
                          {item.ordered}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.received}
                            onChange={(e) =>
                              updateItem(idx, Number(e.target.value))
                            }
                            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded text-[13px] text-right text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </td>
                        <td
                          className={`px-2 py-2 text-[13px] font-bold text-right ${item.variance < 0 ? "text-red-500" : item.variance > 0 ? "text-blue-500" : "text-gray-500 dark:text-gray-400"}`}
                        >
                          {item.variance > 0
                            ? `+${item.variance}`
                            : item.variance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E8ECF0] dark:border-gray-800">
            <Btn label="Cancel" outline onClick={() => {
              setModal(false);
              setErrors({});
            }} />
            <Btn
              label={isEditing ? "Update GRN" : "Confirm GRN"}
              onClick={handleCreate}
              loading={actionLoading}
              color="green"
            />
          </div>
        </Modal>
      )}

      {previewImage && (
        <Modal title="Image Preview" onClose={() => setPreviewImage(null)}>
          <div className="flex justify-center items-center p-2">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[70vh] rounded-lg shadow-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Btn label="Close" outline onClick={() => setPreviewImage(null)} />
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete GRN Record"
          message="Are you sure you want to delete this GRN record? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

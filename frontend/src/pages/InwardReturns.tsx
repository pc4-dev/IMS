import React, { useState, useEffect } from "react";
import { useAppStore } from "../store";
import {
  PageHeader,
  Card,
  StatusBadge,
  Btn,
  Modal,
  Field,
  SField,
  ConfirmModal,
  ImageUpload,
} from "../components/ui";
import { Plus, Printer, Search, Download, Eye, Edit2, Trash2, Camera, Image as ImageIcon } from "lucide-react";
import { InwardReturn } from "../types";
import { genId, todayStr } from "../utils";
import * as XLSX from 'xlsx';

export const InwardReturns = () => {
  const {
    inwardReturns,
    addInwardReturn,
    deleteInwardReturn,
    inventory,
    updateInventory,
    role,
    fetchResource,
    uploadImage,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    fetchResource('inward-returns', 1);
  }, [fetchResource]);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<InwardReturn | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newReturn, setNewReturn] = useState<Partial<InwardReturn>>({
    sku: "",
    name: "",
    qty: 0,
    unit: "",
    condition: "Good",
    supplier: "",
    remarks: "",
    handoverTo: "",
    materialPhotoUrl: "",
  });

  const [uploading, setUploading] = useState(false);

  const handlePhoto = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setNewReturn(prev => ({ ...prev, materialPhotoUrl: url }));
    } catch (error: any) {
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const validateForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.sku) newErrors.sku = "Item selection is required";
    if (!data.qty || data.qty <= 0) newErrors.qty = "Valid quantity is required";
    if (!data.supplier) newErrors.supplier = "Supplier is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [searchItem, setSearchItem] = useState("");

  const handleCreate = async () => {
    if (!validateForm(newReturn)) {
      return;
    }

    const maxIdNum = inwardReturns.reduce((max, ret) => {
      const parts = ret.id.split("-");
      const num = parseInt(parts[parts.length - 1] || "0");
      return num > max ? num : max;
    }, 0);

    const ret: InwardReturn = {
      id: genId("IR", maxIdNum),
      sku: newReturn.sku!,
      name: newReturn.name!,
      qty: Number(newReturn.qty!),
      unit: newReturn.unit!,
      date: todayStr(),
      condition: newReturn.condition as any,
      supplier: newReturn.supplier!,
      remarks: newReturn.remarks,
      handoverTo: newReturn.handoverTo,
      materialPhotoUrl: newReturn.materialPhotoUrl,
    };

    try {
      await addInwardReturn(ret);

      // Subtract from inventory as requested
      const inv = inventory.find((i) => i.sku === ret.sku);
      if (inv) {
        await updateInventory(ret.sku, {
          liveStock: Math.max(0, inv.liveStock - ret.qty),
        });
      }

      setModal(false);
      setNewReturn({
        sku: "",
        name: "",
        qty: 0,
        unit: "",
        condition: "Good",
        supplier: "",
        remarks: "",
        handoverTo: "",
      });
      setErrors({});
    } catch (error: any) {
      alert(`Failed to record inward return: ${error.message}`);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteInwardReturn(deleteConfirm);
        setDeleteConfirm(null);
      } catch (error: any) {
        alert(`Failed to delete: ${error.message}`);
      }
    }
  };

  const selectItem = (item: any) => {
    setNewReturn({
      ...newReturn,
      sku: item.sku,
      name: item.itemName,
      unit: item.unit,
    });
    setSearchItem("");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(inwardReturns);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inward Returns");
    XLSX.writeFile(workbook, `Inward_Returns_${todayStr()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inward Returns"
        sub="Manage material returns to suppliers (Subtracts from Inventory)"
        actions={
          <div className="flex gap-2">
            <Btn
              label="Export"
              icon={Download}
              outline
              onClick={exportToExcel}
            />
            {["Super Admin", "Director", "Store Incharge"].includes(role || "") && (
              <Btn
                label="New Inward Return"
                icon={Plus}
                onClick={() => setModal(true)}
              />
            )}
          </div>
        }
      />

      <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                  Qty
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
              {inwardReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {ret.id}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {ret.date}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1A1A2E] dark:text-gray-300">
                    {ret.supplier}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1A1A2E] dark:text-gray-300">
                    {ret.name}{" "}
                    <span className="text-[11px] text-[#6B7280] dark:text-gray-500 block font-mono">
                      {ret.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-right text-red-600 dark:text-red-400">
                    -{ret.qty} {ret.unit}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ret.condition} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Btn
                      icon={Eye}
                      small
                      outline
                      onClick={() => {
                        setSelectedReturn(ret);
                        setViewModal(true);
                      }}
                      title="View"
                    />
                    {role === "Super Admin" && (
                      <Btn
                        icon={Trash2}
                        small
                        outline
                        color="red"
                        onClick={() => setDeleteConfirm(ret.id)}
                        title="Delete"
                      />
                    )}
                  </td>
                </tr>
              ))}
              {inwardReturns.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-[13px]"
                  >
                    No inward returns recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal 
          title="New Inward Return" 
          onClose={() => {
            setModal(false);
            setErrors({});
          }}
        >
          <div className="space-y-4">
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
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg text-[13px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#F97316] dark:focus:border-orange-500 ${errors.sku ? "border-red-500" : "border-[#E8ECF0] dark:border-gray-700"}`}
                />
              </div>
              {errors.sku && (
                <p className="text-[11px] text-red-500 mt-1">{errors.sku}</p>
              )}
              {searchItem && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-[#E8ECF0] dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {inventory
                    .filter((i) =>
                      i.itemName?.toLowerCase().includes(searchItem.toLowerCase()),
                    )
                    .map((i) => (
                      <div
                        key={i.sku}
                        onClick={() => selectItem(i)}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-[13px] text-gray-900 dark:text-gray-300"
                      >
                        {i.itemName} ({i.sku})
                      </div>
                    ))}
                </div>
              )}
            </div>

            {newReturn.sku && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-[#E8ECF0] dark:border-gray-700 rounded-lg mb-4">
                <p className="text-[11px] font-bold text-[#6B7280] dark:text-gray-500 uppercase">
                  Selected Item
                </p>
                <p className="text-[13px] font-medium text-[#1A1A2E] dark:text-white mt-1">
                  {newReturn.name} ({newReturn.sku})
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Quantity"
                type="number"
                value={newReturn.qty}
                onChange={(e: any) =>
                  setNewReturn({ ...newReturn, qty: e.target.value })
                }
                required
                error={errors.qty}
              />
              <SField
                label="Condition"
                value={newReturn.condition}
                onChange={(e: any) =>
                  setNewReturn({ ...newReturn, condition: e.target.value })
                }
                options={["New", "Good", "Needs Repair", "Damaged"]}
                required
                error={errors.condition}
              />
            </div>

            <Field
              label="Supplier"
              value={newReturn.supplier}
              onChange={(e: any) =>
                setNewReturn({ ...newReturn, supplier: e.target.value })
              }
              required
              error={errors.supplier}
            />
            <Field
              label="Handover To"
              value={newReturn.handoverTo}
              onChange={(e: any) =>
                setNewReturn({ ...newReturn, handoverTo: e.target.value })
              }
            />
            <Field
              label="Remarks"
              value={newReturn.remarks}
              onChange={(e: any) =>
                setNewReturn({ ...newReturn, remarks: e.target.value })
              }
            />

            <ImageUpload
              label="Material Photo"
              id="material-photo-ir"
              value={newReturn.materialPhotoUrl}
              onChange={handlePhoto}
              loading={uploading}
            />

            <div className="flex justify-end gap-2 mt-6">
              <Btn label="Cancel" outline onClick={() => {
                setModal(false);
                setErrors({});
              }} />
              <Btn
                label="Create Return"
                onClick={handleCreate}
                loading={actionLoading}
              />
            </div>
          </div>
        </Modal>
      )}

      {viewModal && selectedReturn && (
        <Modal
          title={`Inward Return Report: ${selectedReturn.id}`}
          wide
          onClose={() => setViewModal(false)}
        >
          <div className="space-y-8 p-2">
            {/* Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedReturn.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Supplier</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedReturn.supplier}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Condition</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedReturn.condition}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Handover To</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedReturn.handoverTo || "N/A"}</p>
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
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    <tr className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-3 text-[12px] font-mono text-gray-500 dark:text-gray-400">{selectedReturn.sku}</td>
                      <td className="px-4 py-3 text-[13px] font-bold text-gray-900 dark:text-white">{selectedReturn.name}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-300 italic">{selectedReturn.remarks || "No remarks"}</td>
                      <td className="px-4 py-3 text-[13px] text-right font-bold text-red-600 dark:text-red-400">
                        {selectedReturn.qty} {selectedReturn.unit}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Photos if available */}
            {selectedReturn.materialPhotoUrl && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Material Photo</p>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                  <img 
                    src={selectedReturn.materialPhotoUrl} 
                    className="w-full h-64 object-contain" 
                    referrerPolicy="no-referrer" 
                    alt="Material"
                  />
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Btn label="Close" outline onClick={() => setViewModal(false)} />
              <Btn label="Download PDF" icon={Download} onClick={() => {/* TODO: Implement PDF */}} />
            </div>
          </div>
        </Modal>
      )}

      {previewImage && (
        <Modal title="Image Preview" onClose={() => setPreviewImage(null)}>
          <img src={previewImage} className="w-full h-auto rounded-lg" referrerPolicy="no-referrer" />
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Inward Return"
          message="Are you sure you want to delete this return record? This action cannot be undone."
          onConfirm={confirmDelete}
          onClose={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

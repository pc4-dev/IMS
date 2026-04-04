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
  ConfirmModal
} from "../components/ui";
import { Plus, Printer, Search, Download, Eye, Edit2, Trash2, Camera, Image as ImageIcon } from "lucide-react";
import { OutwardReturn } from "../types";
import { genId, todayStr } from "../utils";
import * as XLSX from 'xlsx';

export const OutwardReturns = () => {
  const {
    outwardReturns,
    addOutwardReturn,
    deleteOutwardReturn,
    inventory,
    updateInventory,
    role,
    fetchResource,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    fetchResource('outward-returns', 1);
  }, [fetchResource]);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<OutwardReturn | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newReturn, setNewReturn] = useState<Partial<OutwardReturn>>({
    sku: "",
    name: "",
    qty: 0,
    unit: "",
    condition: "Good",
    sourceSite: "",
    remarks: "",
    handoverFrom: "",
    materialPhotoUrl: "",
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewReturn(prev => ({ ...prev, materialPhotoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.sku) newErrors.sku = "Item selection is required";
    if (!data.qty || data.qty <= 0) newErrors.qty = "Valid quantity is required";
    if (!data.sourceSite) newErrors.sourceSite = "Source Site is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [searchItem, setSearchItem] = useState("");

  const handleCreate = async () => {
    if (!validateForm(newReturn)) {
      return;
    }

    const maxIdNum = outwardReturns.reduce((max, ret) => {
      const parts = ret.id.split("-");
      const num = parseInt(parts[parts.length - 1] || "0");
      return num > max ? num : max;
    }, 0);

    const ret: OutwardReturn = {
      id: genId("OR", maxIdNum),
      sku: newReturn.sku!,
      name: newReturn.name!,
      qty: Number(newReturn.qty!),
      unit: newReturn.unit!,
      date: todayStr(),
      condition: newReturn.condition as any,
      sourceSite: newReturn.sourceSite!,
      remarks: newReturn.remarks,
      handoverFrom: newReturn.handoverFrom,
      materialPhotoUrl: newReturn.materialPhotoUrl,
    };

    try {
      await addOutwardReturn(ret);

      // Add to inventory as requested
      const inv = inventory.find((i) => i.sku === ret.sku);
      if (inv) {
        await updateInventory(ret.sku, {
          liveStock: inv.liveStock + ret.qty,
          condition: ret.condition,
        });
      }

      setModal(false);
      setNewReturn({
        sku: "",
        name: "",
        qty: 0,
        unit: "",
        condition: "Good",
        sourceSite: "",
        remarks: "",
        handoverFrom: "",
      });
      setErrors({});
    } catch (error: any) {
      alert(`Failed to record outward return: ${error.message}`);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteOutwardReturn(deleteConfirm);
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
      name: item.name,
      unit: item.unit,
    });
    setSearchItem("");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(outwardReturns);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outward Returns");
    XLSX.writeFile(workbook, `Outward_Returns_${todayStr()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outward Returns"
        sub="Manage material returns from site (Adds to Inventory)"
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
                label="New Outward Return"
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
                  Source Site
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
              {outwardReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {ret.id}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {ret.date}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1A1A2E] dark:text-gray-300">
                    {ret.sourceSite}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1A1A2E] dark:text-gray-300">
                    {ret.name}{" "}
                    <span className="text-[11px] text-[#6B7280] dark:text-gray-500 block font-mono">
                      {ret.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-right text-[#10B981] dark:text-emerald-400">
                    +{ret.qty} {ret.unit}
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
              {outwardReturns.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-[13px]"
                  >
                    No outward returns recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal 
          title="New Outward Return" 
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
                      i.name?.toLowerCase().includes(searchItem.toLowerCase()),
                    )
                    .map((i) => (
                      <div
                        key={i.sku}
                        onClick={() => selectItem(i)}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-[13px] text-gray-900 dark:text-gray-300"
                      >
                        {i.name} ({i.sku})
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
              label="Source Site"
              value={newReturn.sourceSite}
              onChange={(e: any) =>
                setNewReturn({ ...newReturn, sourceSite: e.target.value })
              }
              required
              error={errors.sourceSite}
            />
            <Field
              label="Handover From"
              value={newReturn.handoverFrom}
              onChange={(e: any) =>
                setNewReturn({ ...newReturn, handoverFrom: e.target.value })
              }
            />
            <Field
              label="Remarks"
              value={newReturn.remarks}
              onChange={(e: any) =>
                setNewReturn({ ...newReturn, remarks: e.target.value })
              }
            />

            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-1">
                Material Photo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto}
                  className="hidden"
                  id="material-photo-or"
                />
                <label
                  htmlFor="material-photo-or"
                  className="flex items-center justify-center w-full h-24 border-2 border-dashed border-[#E8ECF0] dark:border-gray-700 rounded-lg cursor-pointer hover:border-[#F97316] transition-colors overflow-hidden relative"
                >
                  {newReturn.materialPhotoUrl ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={newReturn.materialPhotoUrl}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Search className="w-5 h-5 text-white" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setNewReturn(prev => ({ ...prev, materialPhotoUrl: "" }));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <Plus className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-gray-400 mx-auto" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Upload</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

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
          title={`Outward Return Report: ${selectedReturn.id}`}
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
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Source Site</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedReturn.sourceSite}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Condition</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedReturn.condition}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Handover From</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedReturn.handoverFrom || "N/A"}</p>
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
                      <td className="px-4 py-3 text-[13px] text-right font-bold text-emerald-600 dark:text-emerald-400">
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
          title="Delete Outward Return"
          message="Are you sure you want to delete this return record? This action cannot be undone."
          onConfirm={confirmDelete}
          onClose={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

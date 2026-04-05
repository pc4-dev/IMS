import React, { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../store";
import { PageHeader, Card, Btn, Modal, Field, SField, Pagination, ConfirmModal, ImageUpload } from "../components/ui";
import { Plus, Printer, Search, AlertTriangle, Camera, Image as ImageIcon, Edit2, Trash2, Eye, Download } from "lucide-react";
import { MaterialTransferOutward } from "../types";
import { genId, todayStr } from "../utils";
import { PROJECTS, CATEGORIES, UNITS } from "../data";

const INITIAL_TRANSFER: Partial<MaterialTransferOutward> = {
  sku: "",
  name: "",
  qty: 0,
  unit: "",
  fromLocation: "",
  toLocation: "",
  handoverTo: "",
  project: "",
  category: "",
  materialPhotoUrl: "",
  handoverPhotoUrl: "",
  remarks: "",
  module: "Admin",
};

export const MaterialTransferOutwardPage = () => {
  const { 
    materialTransferOutwards, 
    materialTransferOutwardsPagination,
    fetchResource,
    addMaterialTransferOutward, 
    deleteMaterialTransferOutward, 
    updateMaterialTransferOutward,
    inventory, 
    updateInventory, 
    role, 
    uploadImage,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    fetchResource('material-transfer-outward', 1);
  }, [fetchResource]);

  const [modal, setModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<MaterialTransferOutward | null>(null);
  const [newTransfer, setNewTransfer] = useState<Partial<MaterialTransferOutward>>(INITIAL_TRANSFER);
  const [searchItem, setSearchItem] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MaterialTransferOutward | null>(null);

  const validateForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.sku) newErrors.sku = "Item selection is required";
    if (!data.project) newErrors.project = "Project is required";
    if (!data.category) newErrors.category = "Category is required";
    if (!data.qty || data.qty <= 0) newErrors.qty = "Valid quantity is required";
    if (!data.unit) newErrors.unit = "Unit is required";
    if (!data.fromLocation) newErrors.fromLocation = "From Location is required";
    if (!data.toLocation) newErrors.toLocation = "To Location is required";
    if (!data.handoverTo) newErrors.handoverTo = "Handover To is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePageChange = useCallback((page: number) => {
    fetchResource('material-transfer-outward', page);
  }, [fetchResource]);

  const [loadingField, setLoadingField] = useState<string | null>(null);

  const handleMaterialPhoto = async (file: File) => {
    setLoadingField("material");
    try {
      const { url } = await uploadImage(file);
      setNewTransfer(prev => ({ ...prev, materialPhotoUrl: url }));
    } catch (error: any) {
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleHandoverPhoto = async (file: File) => {
    setLoadingField("handover");
    try {
      const { url } = await uploadImage(file);
      setNewTransfer(prev => ({ ...prev, handoverPhotoUrl: url }));
    } catch (error: any) {
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleCreate = async () => {
    if (!validateForm(newTransfer)) {
      return;
    }

    const inv = inventory.find((i) => i.sku === newTransfer.sku);
    if (!inv) {
      setErrors({ sku: "Item not found in inventory!" });
      return;
    }

    if (inv.liveStock < newTransfer.qty!) {
      setErrors({ qty: "Insufficient stock!" });
      return;
    }

    setErrors({});
    try {
      const maxIdNum = materialTransferOutwards.reduce((max, o) => {
        const parts = o.id.split("-");
        const num = parseInt(parts[parts.length - 1] || "0");
        return num > max ? num : max;
      }, 0);

      const transfer: MaterialTransferOutward = {
        id: isEditing && editingId ? editingId : genId("MTO", maxIdNum),
        sku: newTransfer.sku!,
        name: newTransfer.name!,
        qty: Number(newTransfer.qty!),
        unit: newTransfer.unit!,
        date: isEditing && editingId ? (materialTransferOutwards.find(o => o.id === editingId)?.date || todayStr()) : todayStr(),
        fromLocation: newTransfer.fromLocation!,
        toLocation: newTransfer.toLocation!,
        handoverTo: newTransfer.handoverTo!,
        project: newTransfer.project,
        category: newTransfer.category,
        materialPhotoUrl: newTransfer.materialPhotoUrl,
        handoverPhotoUrl: newTransfer.handoverPhotoUrl,
        remarks: newTransfer.remarks,
        module: newTransfer.module || "Admin",
      };

      if (isEditing && editingId) {
        const oldMto = materialTransferOutwards.find(o => o.id === editingId);
        if (oldMto) {
          // Restore old stock first
          const oldInv = inventory.find(i => i.sku === oldMto.sku);
          if (oldInv) {
            await updateInventory(oldMto.sku, {
              liveStock: oldInv.liveStock + oldMto.qty
            });
          }
          
          // Now handle the new SKU
          const newInv = inventory.find(i => i.sku === transfer.sku);
          if (newInv) {
            // If SKU is the same, base is oldInv.liveStock + oldMto.qty
            // If SKU is different, base is newInv.liveStock
            const baseStock = (transfer.sku === oldMto.sku && oldInv) 
              ? (oldInv.liveStock + oldMto.qty) 
              : newInv.liveStock;
            
            await updateMaterialTransferOutward(editingId, transfer);
            await updateInventory(transfer.sku, {
              liveStock: baseStock - transfer.qty
            });
          }
        }
      } else {
        await addMaterialTransferOutward(transfer);
        await updateInventory(transfer.sku, {
          liveStock: inv.liveStock - transfer.qty,
        });
      }
      
      setModal(false);
      setIsEditing(false);
      setEditingId(null);
      setNewTransfer(INITIAL_TRANSFER);
      setSearchItem("");
      setErrors({});
    } catch (error: any) {
      setErrors({ form: `Failed to process material transfer: ${error.message}` });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setErrors({});
    try {
      const mto = deleteConfirm;
      const inv = inventory.find(i => i.sku === mto.sku);
      if (inv) {
        await updateInventory(mto.sku, {
          liveStock: inv.liveStock + mto.qty
        });
      }
      await deleteMaterialTransferOutward(mto.id);
      setDeleteConfirm(null);
    } catch (error: any) {
      setErrors({ form: `Failed to delete: ${error.message}` });
    }
  };

  const handleEdit = (mto: MaterialTransferOutward) => {
    setNewTransfer(mto);
    setEditingId(mto.id);
    setIsEditing(true);
    setModal(true);
  };

  const selectItem = (item: any) => {
    setNewTransfer({
      ...newTransfer,
      sku: item.sku,
      name: item.itemName,
      unit: item.unit,
      category: item.category,
    });
    setSearchItem("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Transfer Outward"
        sub="Transfer materials between sites/locations"
        actions={
          ["Super Admin", "Director", "AGM", "Project Manager", "Store Incharge"].includes(role || "") && (
            <Btn
              label="New Transfer"
              icon={Plus}
              onClick={() => {
                setNewTransfer(INITIAL_TRANSFER);
                setIsEditing(false);
                setEditingId(null);
                setModal(true);
              }}
            />
          )
        }
      />

      <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  MTO No.
                </th>
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
                  From
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  To
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Handover To
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
              {materialTransferOutwards.map((mto) => (
                <tr key={mto.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {mto.id}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {mto.date}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1A1A2E] dark:text-white">
                    {mto.name}{" "}
                    <span className="text-[11px] text-[#6B7280] dark:text-gray-500 block font-mono">
                      {mto.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-right text-[#EF4444] dark:text-red-400">
                    - {mto.qty} {mto.unit}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {mto.fromLocation}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {mto.toLocation}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {mto.handoverTo}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${mto.module === 'Public' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {mto.module || 'Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Btn
                        icon={Eye}
                        small
                        outline
                        onClick={() => {
                          setSelectedTransfer(mto);
                          setViewModal(true);
                        }}
                        title="View"
                      />
                      {["Super Admin", "Director", "AGM", "Project Manager", "Store Incharge"].includes(role || "") && (
                        <>
                          <Btn
                            icon={Edit2}
                            small
                            outline
                            onClick={() => handleEdit(mto)}
                            title="Edit"
                          />
                          <Btn
                            icon={Trash2}
                            small
                            outline
                            color="red"
                            onClick={() => setDeleteConfirm(mto)}
                            title="Delete"
                          />
                        </>
                      )}
                      <Btn
                        icon={Printer}
                        small
                        outline
                        onClick={() => window.print()}
                        title="Print"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {materialTransferOutwards.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-[13px]"
                  >
                    No material transfers recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {materialTransferOutwardsPagination && (
        <Pagination
          data={materialTransferOutwardsPagination}
          onPageChange={handlePageChange}
        />
      )}

      {viewModal && selectedTransfer && (
        <Modal
          title={`Transfer Report: ${selectedTransfer.id}`}
          wide
          onClose={() => setViewModal(false)}
          footer={
            <div className="flex justify-end gap-3">
              <Btn label="Close" outline onClick={() => setViewModal(false)} />
            </div>
          }
        >
          <div className="space-y-8 p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Handover To</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.handoverTo}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">From Location</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.fromLocation}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Module</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.module || 'Admin'}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  <tr>
                    <td className="px-4 py-3 text-[12px] font-mono text-gray-500 dark:text-gray-400">{selectedTransfer.sku}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.name}</td>
                    <td className="px-4 py-3 text-[13px] text-right font-bold text-red-600 dark:text-red-400">
                      -{selectedTransfer.qty} {selectedTransfer.unit}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {selectedTransfer.remarks && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Remarks</p>
                <p className="text-[13px] text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  {selectedTransfer.remarks}
                </p>
              </div>
            )}

            {(selectedTransfer.materialPhotoUrl || selectedTransfer.handoverPhotoUrl) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedTransfer.materialPhotoUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Material Photo</p>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <img src={selectedTransfer.materialPhotoUrl} className="w-full h-64 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
                {selectedTransfer.handoverPhotoUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Handover Photo</p>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <img src={selectedTransfer.handoverPhotoUrl} className="w-full h-64 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {modal && (
        <Modal 
          title={isEditing ? `Edit Material Transfer (${editingId})` : "New Material Transfer (MTO)"} 
          onClose={() => setModal(false)}
          footer={
            <div className="flex justify-end gap-3">
              <Btn label="Cancel" outline onClick={() => setModal(false)} />
              <Btn label={actionLoading ? "Processing..." : (isEditing ? "Update MTO" : "Generate MTO")} onClick={handleCreate} loading={actionLoading} />
            </div>
          }
        >
          <div className="space-y-4">
            {!isEditing && (
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
                {searchItem && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-[#E8ECF0] dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {inventory
                      .filter((i) =>
                        i.itemName?.toLowerCase().includes(searchItem.toLowerCase()) && i.liveStock > 0
                      )
                      .map((i) => (
                        <div
                          key={i.sku}
                          onClick={() => selectItem(i)}
                          className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-[13px] flex justify-between"
                        >
                          <span>{i.itemName} ({i.sku})</span>
                          <span className="font-bold text-[#10B981]">{i.liveStock} {i.unit}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {newTransfer.sku && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-[#E8ECF0] dark:border-gray-700 rounded-lg mb-4 text-[13px]">
                <p className="font-bold text-[#6B7280] uppercase text-[11px]">Selected: {newTransfer.name}</p>
                <p className="text-[#10B981] font-bold">Available: {inventory.find(i => i.sku === newTransfer.sku)?.liveStock} {newTransfer.unit}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <SField label="Project *" value={newTransfer.project} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, project: e.target.value }))} options={PROJECTS} error={errors.project} />
              <SField label="Category *" value={newTransfer.category} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, category: e.target.value }))} options={CATEGORIES} error={errors.category} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Qty *" type="number" value={newTransfer.qty} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, qty: e.target.value }))} error={errors.qty} />
              <SField label="Unit *" value={newTransfer.unit} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, unit: e.target.value }))} options={UNITS} error={errors.unit} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="From Location *" value={newTransfer.fromLocation} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, fromLocation: e.target.value }))} error={errors.fromLocation} />
              <Field label="To Location *" value={newTransfer.toLocation} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, toLocation: e.target.value }))} error={errors.toLocation} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Handover To *" value={newTransfer.handoverTo} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, handoverTo: e.target.value }))} error={errors.handoverTo} />
              <Field label="Remarks" value={newTransfer.remarks} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, remarks: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ImageUpload label="Material Photo" id="mto-material" value={newTransfer.materialPhotoUrl} onChange={handleMaterialPhoto} loading={loadingField === "material"} />
              <ImageUpload label="Handover Photo" id="mto-handover" value={newTransfer.handoverPhotoUrl} onChange={handleHandoverPhoto} loading={loadingField === "handover"} />
            </div>
          </div>
        </Modal>
      )}

      {previewImage && (
        <Modal title="Image Preview" onClose={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[70vh] rounded-lg mx-auto" referrerPolicy="no-referrer" />
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Transfer Record"
          message={`This will delete the transfer record ${deleteConfirm.id}. Stock will be restored.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

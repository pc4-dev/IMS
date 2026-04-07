import React, { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../store";
import { PageHeader, Card, Btn, Modal, Field, SField, Pagination, ConfirmModal, ImageUpload } from "../components/ui";
import { Plus, Printer, Search, AlertTriangle, Camera, Image as ImageIcon, Edit2, Trash2, Eye, Download } from "lucide-react";
import { MaterialTransferOutward } from "../types";
import { genId, todayStr } from "../utils";
import { PROJECTS, CATEGORIES, UNITS } from "../data";
import { toast } from "react-hot-toast";

const INITIAL_TRANSFER: Partial<MaterialTransferOutward> = {
  fromLocation: "Garden city Store",
  toLocation: "",
  handoverTo: "",
  handoverPhotoUrl: "",
  remarks: "",
  module: "Admin",
  items: [],
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
    if (!data.fromLocation) newErrors.fromLocation = "Source Site is required";
    if (!data.toLocation) newErrors.toLocation = "Destination Site is required";
    if (!data.handoverTo) newErrors.handoverTo = "Handover To is required";
    if (!data.items || data.items.length === 0) {
      newErrors.items = "At least one item is required";
    } else {
      data.items.forEach((item: any, index: number) => {
        if (!item.sku) newErrors[`item-${index}-sku`] = "Item selection is required";
        if (!item.qty || item.qty <= 0) newErrors[`item-${index}-qty`] = "Valid quantity is required";
      });
    }
    
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
      toast.success("Material photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleHandoverPhoto = async (file: File) => {
    setLoadingField("handover");
    try {
      const { url } = await uploadImage(file);
      setNewTransfer(prev => ({ ...prev, handoverPhotoUrl: url }));
      toast.success("Handover photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const addItem = () => {
    setNewTransfer(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { sku: "", name: "", qty: 0, unit: "", category: "" }
      ]
    }));
  };

  const removeItem = (index: number) => {
    setNewTransfer(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setNewTransfer(prev => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const handleItemPhoto = async (index: number, file: File) => {
    setLoadingField(`item-${index}`);
    try {
      const { url } = await uploadImage(file);
      updateItem(index, 'materialPhotoUrl', url);
      toast.success("Item photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleCreate = async () => {
    if (!validateForm(newTransfer)) {
      return;
    }

    // Stock validation
    for (const item of newTransfer.items!) {
      const inv = inventory.find((i) => i.sku === item.sku);
      if (!inv) {
        toast.error(`Item ${item.name} not found in inventory!`);
        return;
      }
      if (inv.liveStock < item.qty) {
        toast.error(`Insufficient stock for ${item.name}!`);
        return;
      }
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
        date: isEditing && editingId ? (materialTransferOutwards.find(o => o.id === editingId)?.date || todayStr()) : todayStr(),
        fromLocation: newTransfer.fromLocation!,
        toLocation: newTransfer.toLocation!,
        handoverTo: newTransfer.handoverTo!,
        handoverPhotoUrl: newTransfer.handoverPhotoUrl,
        remarks: newTransfer.remarks,
        module: newTransfer.module || "Admin",
        items: newTransfer.items as any[],
      };

      if (isEditing && editingId) {
        await updateMaterialTransferOutward(editingId, transfer);
        toast.success("Transfer record updated successfully");
      } else {
        await addMaterialTransferOutward(transfer);
        toast.success("Transfer record created successfully");
      }
      
      setModal(false);
      setIsEditing(false);
      setEditingId(null);
      setNewTransfer(INITIAL_TRANSFER);
      setSearchItem("");
      setErrors({});
    } catch (error: any) {
      setErrors({ form: `Failed to process material transfer: ${error.message}` });
      toast.error(error.message || "Failed to process transfer");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setErrors({});
    try {
      await deleteMaterialTransferOutward(deleteConfirm.id);
      setDeleteConfirm(null);
      toast.success("Transfer record deleted and stock restored");
    } catch (error: any) {
      setErrors({ form: `Failed to delete: ${error.message}` });
      toast.error(error.message || "Failed to delete transfer");
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
                  Items
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
                    {mto.items.length} Items
                    <span className="text-[11px] text-[#6B7280] dark:text-gray-500 block">
                      {mto.items[0]?.name} {mto.items.length > 1 ? `+ ${mto.items.length - 1} more` : ''}
                    </span>
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
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Photo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {selectedTransfer.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-[12px] font-mono text-gray-500 dark:text-gray-400">{item.sku}</td>
                      <td className="px-4 py-3 text-[13px] font-bold text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-3 text-[13px] text-right font-bold text-red-600 dark:text-red-400">
                        -{item.qty} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        {item.materialPhotoUrl && (
                          <img 
                            src={item.materialPhotoUrl} 
                            className="w-10 h-10 object-cover rounded cursor-pointer" 
                            onClick={() => setPreviewImage(item.materialPhotoUrl!)}
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
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

            {selectedTransfer.handoverPhotoUrl && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Handover Photo</p>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                  <img src={selectedTransfer.handoverPhotoUrl} className="w-full h-64 object-contain" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {modal && (
        <Modal 
          title={isEditing ? `Edit Material Transfer (${editingId})` : "New Material Transfer (Multi-Item)"} 
          wide
          onClose={() => setModal(false)}
          footer={
            <div className="flex justify-end gap-3">
              <Btn label="Cancel" outline onClick={() => setModal(false)} />
              <Btn label={actionLoading ? "Processing..." : (isEditing ? "Update MTO" : "Generate MTO")} onClick={handleCreate} loading={actionLoading} />
            </div>
          }
        >
          <div className="space-y-8">
            <div className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SField label="Source Site *" value={newTransfer.fromLocation} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, fromLocation: e.target.value }))} options={PROJECTS} error={errors.fromLocation} />
                <SField label="Destination Site *" value={newTransfer.toLocation} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, toLocation: e.target.value }))} options={PROJECTS} error={errors.toLocation} />
                <Field label="Handover To *" value={newTransfer.handoverTo} onChange={(e: any) => setNewTransfer(prev => ({ ...prev, handoverTo: e.target.value }))} error={errors.handoverTo} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-2">Handover Photo</label>
                  <ImageUpload 
                    id="mto-handover" 
                    value={newTransfer.handoverPhotoUrl} 
                    onChange={handleHandoverPhoto} 
                    loading={loadingField === "handover"} 
                    small 
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-1.5">Remarks</label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-[#E8ECF0] dark:border-gray-700 rounded-lg text-[13px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 min-h-[60px] transition-all"
                    placeholder="Enter any additional notes..."
                    value={newTransfer.remarks}
                    onChange={(e) => setNewTransfer(prev => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#F97316] rounded-full" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Items to Transfer</h3>
                </div>
                <Btn label="Add Item" icon={Plus} small onClick={addItem} />
              </div>

              <div className="overflow-x-auto border border-[#E8ECF0] dark:border-gray-800 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                      <th className="px-4 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Item Selection</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Details</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Image</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
                    {newTransfer.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 min-w-[250px]">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search SKU or Name..."
                              className={`w-full px-3 py-1.5 border rounded text-[12px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#F97316] ${errors[`item-${idx}-sku`] ? "border-red-500" : "border-[#E8ECF0] dark:border-gray-700"}`}
                              value={item.sku ? `${item.name} (${item.sku})` : searchItem}
                              onChange={(e) => {
                                if (item.sku) {
                                  updateItem(idx, 'sku', '');
                                  updateItem(idx, 'name', '');
                                }
                                setSearchItem(e.target.value);
                              }}
                            />
                            {!item.sku && searchItem && (
                              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-900 border border-[#E8ECF0] dark:border-gray-700 rounded shadow-lg max-h-32 overflow-y-auto">
                                {inventory
                                  .filter(inv => inv.itemName.toLowerCase().includes(searchItem.toLowerCase()) || inv.sku.toLowerCase().includes(searchItem.toLowerCase()))
                                  .map(inv => (
                                    <div
                                      key={inv.sku}
                                      className="px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-[12px]"
                                      onClick={() => {
                                        updateItem(idx, 'sku', inv.sku);
                                        updateItem(idx, 'name', inv.itemName);
                                        updateItem(idx, 'unit', inv.unit);
                                        updateItem(idx, 'category', inv.category);
                                        setSearchItem("");
                                      }}
                                    >
                                      {inv.itemName} ({inv.sku}) - <span className="text-green-600 font-bold">{inv.liveStock}</span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-gray-500 italic">
                          {item.sku ? (
                            <div className="space-y-0.5">
                              <div>{item.category} | {item.unit}</div>
                              <div className="text-green-600 font-bold not-italic">
                                Live Stock: {inventory.find(i => i.sku === item.sku)?.liveStock || 0}
                              </div>
                            </div>
                          ) : 'Select an item first'}
                        </td>
                        <td className="px-4 py-3 w-[120px]">
                          <input
                            type="number"
                            className={`w-full px-3 py-1.5 border rounded text-[12px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#F97316] ${errors[`item-${idx}-qty`] ? "border-red-500" : "border-[#E8ECF0] dark:border-gray-700"}`}
                            value={item.qty}
                            onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <ImageUpload
                            id={`item-photo-${idx}`}
                            value={item.materialPhotoUrl}
                            onChange={(file) => handleItemPhoto(idx, file)}
                            loading={loadingField === `item-${idx}`}
                            small
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Btn icon={Trash2} small outline color="red" onClick={() => removeItem(idx)} />
                        </td>
                      </tr>
                    ))}
                    {(!newTransfer.items || newTransfer.items.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-[12px]">
                          No items added yet. Click "Add Item" to start.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {errors.items && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.items}</p>}
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

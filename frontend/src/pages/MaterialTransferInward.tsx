import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  ArrowRightLeft, 
  Calendar, 
  User, 
  MapPin, 
  Package, 
  ChevronRight, 
  Filter, 
  Download, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2, 
  Printer, 
  X, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  ArrowDownToLine
} from "lucide-react";
import { useAppStore } from "../store";
import { MaterialTransferInward } from "../types";
import { Card, Btn, Modal } from "../components/ui";
import { genId, todayStr } from "../utils";
import { toast } from "react-hot-toast";

const INITIAL_TRANSFER: Partial<MaterialTransferInward> = {
  location: "Garden city Store",
  receivedBy: "",
  handoverPhotoUrl: "",
  remarks: "",
  module: "Admin",
  items: [],
};

export const MaterialTransferInwardPage = () => {
  const { 
    materialTransferInwards, 
    materialTransferOutwards,
    fetchResource,
    addMaterialTransferInward, 
    deleteMaterialTransferInward, 
    updateMaterialTransferInward,
    uploadImage,
    role, 
    actionLoading 
  } = useAppStore();

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<MaterialTransferInward | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTransfer, setNewTransfer] = useState<Partial<MaterialTransferInward>>(INITIAL_TRANSFER);
  const [searchItem, setSearchItem] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<MaterialTransferInward | null>(null);
  const [loadingField, setLoadingField] = useState<string | null>(null);

  useEffect(() => {
    fetchResource('material-transfer-inward');
    fetchResource('material-transfer-outward');
  }, [fetchResource]);

  const filteredTransfers = materialTransferInwards.filter(mto => 
    mto.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mto.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mto.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const validate = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.location) newErrors.location = "Location is required";
    if (!data.receivedBy) newErrors.receivedBy = "Received By is required";
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

  const addItem = () => {
    setNewTransfer(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { sku: "", name: "", qty: 0, unit: "", category: "", materialPhotoUrl: "" }
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
      const url = await uploadImage(file);
      updateItem(index, 'materialPhotoUrl', url);
      toast.success("Item photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleHandoverPhoto = async (file: File) => {
    setLoadingField("handover");
    try {
      const url = await uploadImage(file);
      setNewTransfer(prev => ({ ...prev, handoverPhotoUrl: url }));
      toast.success("Handover photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleCreate = async () => {
    if (!validate(newTransfer)) return;

    try {
      const transfer: MaterialTransferInward = {
        id: isEditing && editingId ? editingId : genId("MTI", materialTransferInwards.length),
        date: isEditing && editingId ? (materialTransferInwards.find(o => o.id === editingId)?.date || todayStr()) : todayStr(),
        location: newTransfer.location!,
        receivedBy: newTransfer.receivedBy!,
        handoverPhotoUrl: newTransfer.handoverPhotoUrl,
        remarks: newTransfer.remarks,
        module: newTransfer.module || "Admin",
        items: newTransfer.items as any[],
      };

      if (isEditing && editingId) {
        await updateMaterialTransferInward(editingId, transfer);
        toast.success("Inward record updated");
      } else {
        await addMaterialTransferInward(transfer);
        toast.success("Inward record created");
      }
      
      setModal(false);
      setIsEditing(false);
      setEditingId(null);
      setNewTransfer(INITIAL_TRANSFER);
      setErrors({});
    } catch (error: any) {
      setErrors({ form: error.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setErrors({});
    try {
      await deleteMaterialTransferInward(deleteConfirm.id);
      setDeleteConfirm(null);
      toast.success("Transfer deleted successfully");
    } catch (error: any) {
      setErrors({ form: `Failed to delete: ${error.message}` });
    }
  };

  const handleEdit = (mto: MaterialTransferInward) => {
    setNewTransfer({
      ...mto,
      items: [...mto.items]
    });
    setEditingId(mto.id);
    setIsEditing(true);
    setModal(true);
  };

  const selectItem = (index: number, item: any) => {
    updateItem(index, 'sku', item.sku);
    updateItem(index, 'name', item.name);
    updateItem(index, 'unit', item.unit);
    updateItem(index, 'category', item.category);
    updateItem(index, 'qty', item.qty);
    setSearchItem("");
  };

  const handleImageUpload = async (file: File, field: 'materialPhotoUrl' | 'personPhotoUrl') => {
    try {
      const url = await uploadImage(file);
      setNewTransfer({ ...newTransfer, [field]: url });
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] dark:text-white flex items-center gap-2">
            <ArrowDownToLine className="w-6 h-6 text-green-500" />
            Material Transfer Inward
          </h1>
          <p className="text-[#6B7280] dark:text-gray-400 text-sm mt-1">
            Manage and track materials received from other locations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transfers..."
              className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-[#E8ECF0] dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {["Super Admin", "Director", "AGM", "Project Manager", "Store Incharge"].includes(role || "") && (
            <Btn
              label="New Inward"
              icon={Plus}
              onClick={() => {
                setNewTransfer(INITIAL_TRANSFER);
                setIsEditing(false);
                setEditingId(null);
                setModal(true);
              }}
            />
          )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  MTI No.
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
                  Location
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Received By
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
              {filteredTransfers.map((mto) => (
                <tr key={mto.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {mto.id}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {mto.date}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1A1A2E] dark:text-white">
                    {mto.items?.length > 0 ? (
                      <div>
                        <span className="font-bold">{mto.items[0].name}</span>
                        {mto.items.length > 1 && (
                          <span className="ml-1 text-xs text-gray-500">
                            (+{mto.items.length - 1} more)
                          </span>
                        )}
                        <span className="text-[11px] text-[#6B7280] dark:text-gray-500 block font-mono">
                          {mto.items[0].sku}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No items</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-right text-green-600 dark:text-green-400">
                    {mto.items?.length || 0} Items
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {mto.location}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {mto.receivedBy}
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
              {filteredTransfers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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

      {/* Create/Edit Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={isEditing ? "Edit Inward Transfer" : "New Inward Transfer (Multi-Item)"}
          wide
          footer={
            <div className="flex justify-end gap-3">
              <Btn label="Cancel" outline onClick={() => setModal(false)} />
              <Btn 
                label={isEditing ? "Update Transfer" : "Record Transfer"} 
                onClick={handleCreate} 
                loading={actionLoading}
              />
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Receiving Location
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border ${errors.location ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                  value={newTransfer.location}
                  onChange={(e) => setNewTransfer({ ...newTransfer, location: e.target.value })}
                  placeholder="e.g. Garden City Store"
                />
                {errors.location && <p className="text-[10px] text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Received By
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border ${errors.receivedBy ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                  value={newTransfer.receivedBy}
                  onChange={(e) => setNewTransfer({ ...newTransfer, receivedBy: e.target.value })}
                  placeholder="Person name"
                />
                {errors.receivedBy && <p className="text-[10px] text-red-500 mt-1">{errors.receivedBy}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Items to Receive</h3>
                <Btn label="Add Item" icon={Plus} small outline onClick={addItem} />
              </div>
              
              {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}

              <div className="space-y-4">
                {newTransfer.items?.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4 relative">
                    <button 
                      onClick={() => removeItem(index)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 relative">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Search MTO Item</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            className={`w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border ${errors[`item-${index}-sku`] ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                            placeholder="Search by SKU, Name or MTO No..."
                            onChange={(e) => setSearchItem(e.target.value)}
                          />
                        </div>
                        {searchItem && (
                          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {materialTransferOutwards
                              .filter(mto => 
                                mto.id.toLowerCase().includes(searchItem.toLowerCase()) ||
                                mto.items.some(i => i.sku.toLowerCase().includes(searchItem.toLowerCase()) || i.name.toLowerCase().includes(searchItem.toLowerCase()))
                              )
                              .flatMap(mto => mto.items.map(i => ({ ...i, mtoId: mto.id })))
                              .map((i, iIdx) => (
                                <button
                                  key={`${i.sku}-${iIdx}`}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
                                  onClick={() => selectItem(index, i)}
                                >
                                  <div className="font-bold text-[#1A1A2E] dark:text-white">{i.name}</div>
                                  <div className="text-xs text-gray-500 font-mono">{i.sku} • MTO: {i.mtoId} • Qty: {i.qty} {i.unit}</div>
                                </button>
                              ))}
                          </div>
                        )}
                        {item.sku && (
                          <div className="mt-2 text-xs font-bold text-green-600 dark:text-green-400">
                            Selected: {item.name} ({item.sku})
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quantity</label>
                        <input
                          type="number"
                          className={`w-full px-4 py-2 bg-white dark:bg-gray-900 border ${errors[`item-${index}-qty`] ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                          value={item.qty || ""}
                          onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Item Photo</label>
                        <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-2 overflow-hidden group">
                          {item.materialPhotoUrl ? (
                            <>
                              <img src={item.materialPhotoUrl} className="w-full h-full object-cover" alt="Item" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Btn icon={Camera} small label="Change" onClick={() => (document.getElementById(`item-photo-${index}`) as HTMLInputElement).click()} />
                              </div>
                            </>
                          ) : (
                            <>
                              {loadingField === `item-${index}` ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent" />
                              ) : (
                                <>
                                  <Camera className="w-5 h-5 text-gray-400" />
                                  <span className="text-[10px] text-gray-500 uppercase font-bold">Upload Photo</span>
                                </>
                              )}
                              <input 
                                id={`item-photo-${index}`}
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => e.target.files?.[0] && handleItemPhoto(index, e.target.files[0])}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Handover Photo (Optional)</label>
                <div className="relative aspect-video rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-2 overflow-hidden group">
                  {newTransfer.handoverPhotoUrl ? (
                    <>
                      <img src={newTransfer.handoverPhotoUrl} className="w-full h-full object-cover" alt="Handover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Btn icon={Camera} small label="Change" onClick={() => (document.getElementById('handover-photo') as HTMLInputElement).click()} />
                      </div>
                    </>
                  ) : (
                    <>
                      {loadingField === 'handover' ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-400" />
                          <span className="text-xs text-gray-500 font-bold uppercase">Upload Handover Photo</span>
                        </>
                      )}
                      <input 
                        id="handover-photo"
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => e.target.files?.[0] && handleHandoverPhoto(e.target.files[0])}
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Remarks</label>
                <textarea
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 h-[120px]"
                  value={newTransfer.remarks}
                  onChange={(e) => setNewTransfer({ ...newTransfer, remarks: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            {errors.form && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-5 h-5" />
                {errors.form}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewModal && (
        <Modal
          onClose={() => setViewModal(false)}
          title="Inward Transfer Report"
          wide
          footer={<Btn label="Close" outline onClick={() => setViewModal(false)} />}
        >
          {selectedTransfer && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">MTI Number</p>
                  <p className="text-lg font-bold text-[#1A1A2E] dark:text-white">{selectedTransfer.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedTransfer.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Receiving Location</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Received By</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.receivedBy}</p>
                </div>
              </div>

              <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Qty</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-center">Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedTransfer.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-bold text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-[11px] text-gray-500 font-mono">{item.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-bold text-right text-green-600 dark:text-green-400">
                          {item.qty} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.materialPhotoUrl ? (
                            <img 
                              src={item.materialPhotoUrl} 
                              className="w-10 h-10 object-cover rounded-lg mx-auto border border-gray-200" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400">No photo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedTransfer.handoverPhotoUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Handover Photo</p>
                    <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      <img 
                        src={selectedTransfer.handoverPhotoUrl} 
                        alt="Handover" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
                {selectedTransfer.remarks && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Remarks</p>
                    <p className="text-[13px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 italic">
                      "{selectedTransfer.remarks}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          onClose={() => setDeleteConfirm(null)}
          title="Confirm Delete"
          footer={
            <div className="flex justify-end gap-3">
              <Btn label="Cancel" outline onClick={() => setDeleteConfirm(null)} />
              <Btn label="Delete" color="red" onClick={handleDelete} loading={actionLoading} />
            </div>
          }
        >
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-900 dark:text-red-400">Are you sure you want to delete this transfer?</p>
              <p className="text-xs text-red-700 dark:text-red-500 mt-1">Are you sure you want to delete this record?</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

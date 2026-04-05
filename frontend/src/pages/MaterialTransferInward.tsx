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
  sku: "",
  name: "",
  qty: 0,
  unit: "",
  location: "",
  receivedBy: "",
  project: "",
  category: "",
  materialPhotoUrl: "",
  personPhotoUrl: "",
  remarks: "",
  module: "Admin",
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
  const [errors, setErrors] = useState<any>({});
  const [deleteConfirm, setDeleteConfirm] = useState<MaterialTransferInward | null>(null);

  useEffect(() => {
    fetchResource('material-transfer-inward');
    fetchResource('material-transfer-outward');
  }, []);

  const filteredTransfers = materialTransferInwards.filter(mto => 
    mto.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mto.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mto.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validate = () => {
    const newErrors: any = {};
    if (!newTransfer.sku) newErrors.sku = "Required";
    if (!newTransfer.qty || newTransfer.qty <= 0) newErrors.qty = "Must be > 0";
    if (!newTransfer.location) newErrors.location = "Required";
    if (!newTransfer.receivedBy) newErrors.receivedBy = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const genId = (prefix: string, lastNum: number) => {
    return `${prefix}-${String(lastNum + 1).padStart(4, "0")}`;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      const transfer: MaterialTransferInward = {
        id: isEditing && editingId ? editingId : genId("MTI", materialTransferInwards.length),
        sku: newTransfer.sku!,
        name: newTransfer.name!,
        qty: Number(newTransfer.qty!),
        unit: newTransfer.unit!,
        date: isEditing && editingId ? (materialTransferInwards.find(o => o.id === editingId)?.date || todayStr()) : todayStr(),
        location: newTransfer.location!,
        receivedBy: newTransfer.receivedBy!,
        project: newTransfer.project,
        category: newTransfer.category,
        materialPhotoUrl: newTransfer.materialPhotoUrl,
        personPhotoUrl: newTransfer.personPhotoUrl,
        remarks: newTransfer.remarks,
        module: newTransfer.module || "Admin",
      };

      if (isEditing && editingId) {
        await updateMaterialTransferInward(editingId, transfer);
      } else {
        await addMaterialTransferInward(transfer);
      }

      setModal(false);
      setNewTransfer(INITIAL_TRANSFER);
      setIsEditing(false);
      setEditingId(null);
      toast.success(isEditing ? "Transfer updated successfully" : "Transfer recorded successfully");
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
    setNewTransfer(mto);
    setEditingId(mto.id);
    setIsEditing(true);
    setModal(true);
  };

  const selectItem = (item: any) => {
    setNewTransfer({
      ...newTransfer,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      category: item.category,
      project: item.project || "",
      qty: item.qty, // Auto-fill quantity from MTO
    });
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
                    {mto.name}{" "}
                    <span className="text-[11px] text-[#6B7280] dark:text-gray-500 block font-mono">
                      {mto.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-right text-green-600 dark:text-green-400">
                    + {mto.qty} {mto.unit}
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
          title={isEditing ? "Edit Inward Transfer" : "New Inward Transfer"}
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
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Search MTO (SKU, Name or MTO No)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  placeholder="Search MTO records..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                />
              </div>
              {searchItem && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {materialTransferOutwards
                    .filter(item => 
                      item.sku.toLowerCase().includes(searchItem.toLowerCase()) ||
                      item.name.toLowerCase().includes(searchItem.toLowerCase()) ||
                      item.id.toLowerCase().includes(searchItem.toLowerCase())
                    )
                    .map(item => (
                      <button
                        key={item.id}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
                        onClick={() => selectItem(item)}
                      >
                        <div className="font-bold text-[#1A1A2E] dark:text-white">{item.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{item.sku} • MTO: {item.id} • Qty: {item.qty} {item.unit}</div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {newTransfer.sku && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">Selected Item</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{newTransfer.name}</p>
                <p className="text-xs text-gray-500 font-mono">{newTransfer.sku}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border ${errors.qty ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                  value={newTransfer.qty}
                  onChange={(e) => setNewTransfer({ ...newTransfer, qty: Number(e.target.value) })}
                />
                {errors.qty && <p className="text-[10px] text-red-500 mt-1">{errors.qty}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border ${errors.location ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                  value={newTransfer.location}
                  onChange={(e) => setNewTransfer({ ...newTransfer, location: e.target.value })}
                  placeholder="Receiving location"
                />
                {errors.location && <p className="text-[10px] text-red-500 mt-1">{errors.location}</p>}
              </div>
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

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Remarks
              </label>
              <textarea
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 min-h-[80px]"
                value={newTransfer.remarks}
                onChange={(e) => setNewTransfer({ ...newTransfer, remarks: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Material Photo</label>
                <div className="relative">
                  <input
                    type="file"
                    className="hidden"
                    id="material-photo"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'materialPhotoUrl')}
                  />
                  <label
                    htmlFor="material-photo"
                    className="flex flex-col items-center justify-center gap-2 w-full aspect-video border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-green-500 transition-colors overflow-hidden relative group"
                  >
                    {newTransfer.materialPhotoUrl ? (
                      <>
                        <img src={newTransfer.materialPhotoUrl} alt="Material" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Upload Photo</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Person Photo</label>
                <div className="relative">
                  <input
                    type="file"
                    className="hidden"
                    id="person-photo"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'personPhotoUrl')}
                  />
                  <label
                    htmlFor="person-photo"
                    className="flex flex-col items-center justify-center gap-2 w-full aspect-video border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-green-500 transition-colors overflow-hidden relative group"
                  >
                    {newTransfer.personPhotoUrl ? (
                      <>
                        <img src={newTransfer.personPhotoUrl} alt="Person" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Upload Photo</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {errors.form && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4" />
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
          title="Transfer Details"
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
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Item Details</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono">{selectedTransfer.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity</p>
                  <p className="text-[13px] font-bold text-green-600 dark:text-green-400">+ {selectedTransfer.qty} {selectedTransfer.unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Location</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.location}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Module</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.module || 'Admin'}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Received By</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedTransfer.receivedBy}</p>
                </div>
              </div>

              {selectedTransfer.remarks && (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Remarks</p>
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 italic">
                    "{selectedTransfer.remarks}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedTransfer.materialPhotoUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Material Photo</p>
                    <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      <img 
                        src={selectedTransfer.materialPhotoUrl} 
                        alt="Material" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
                {selectedTransfer.personPhotoUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Person Photo</p>
                    <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      <img 
                        src={selectedTransfer.personPhotoUrl} 
                        alt="Person" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
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

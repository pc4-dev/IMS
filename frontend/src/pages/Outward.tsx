import React, { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../store";
import { PageHeader, Card, Btn, Modal, Field, SField, Pagination, ConfirmModal, ImageUpload } from "../components/ui";
import { Plus, Printer, Search, AlertTriangle, Camera, Image as ImageIcon, Edit2, Trash2, Eye, Download } from "lucide-react";
import { Outward } from "../types";
import { genId, todayStr } from "../utils";
import { PROJECTS, CATEGORIES, UNITS } from "../data";

const INITIAL_OUTWARD: Partial<Outward> = {
  sku: "",
  name: "",
  qty: 0,
  unit: "",
  location: "",
  handoverTo: "",
  project: "",
  category: "",
  materialPhotoUrl: "",
  handoverPhotoUrl: "",
};

export const OutwardPage = () => {
  const { 
    outwards, 
    outwardsPagination,
    fetchResource,
    addOutward, 
    updateOutward, 
    deleteOutward, 
    inventory, 
    updateInventory, 
    role, 
    uploadImage,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    fetchResource('outward', 1);
  }, [fetchResource]);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedOutward, setSelectedOutward] = useState<Outward | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOutward, setNewOutward] = useState<Partial<Outward>>(INITIAL_OUTWARD);
  const [searchItem, setSearchItem] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Outward | null>(null);

  const validateForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.sku) newErrors.sku = "Item selection is required";
    if (!data.project) newErrors.project = "Project is required";
    if (!data.category) newErrors.category = "Category is required";
    if (!data.qty || data.qty <= 0) newErrors.qty = "Valid quantity is required";
    if (!data.unit) newErrors.unit = "Unit is required";
    if (!data.location) newErrors.location = "Location is required";
    if (!data.handoverTo) newErrors.handoverTo = "Handover To is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePageChange = useCallback((page: number) => {
    fetchResource('outward', page);
  }, [fetchResource]);

  const [loadingField, setLoadingField] = useState<string | null>(null);

  const handleMaterialPhoto = async (file: File) => {
    setLoadingField("material");
    try {
      const { url } = await uploadImage(file);
      setNewOutward(prev => ({ ...prev, materialPhotoUrl: url }));
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
      setNewOutward(prev => ({ ...prev, handoverPhotoUrl: url }));
    } catch (error: any) {
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleCreate = async () => {
    if (!validateForm(newOutward)) {
      return;
    }

    const inv = inventory.find((i) => i.sku === newOutward.sku);
    if (!inv) {
      setErrors({ sku: "Item not found in inventory!" });
      return;
    }

    if (!isEditing && inv.liveStock < newOutward.qty!) {
      setErrors({ qty: "Insufficient stock!" });
      return;
    }

    setErrors({});
    try {
      if (isEditing && editingId) {
        const original = outwards.find(o => o.id === editingId);
        if (original) {
          // Adjust inventory if quantity changed
          const qtyDiff = Number(newOutward.qty!) - original.qty;
          if (inv.liveStock < qtyDiff) {
            setErrors({ qty: "Insufficient stock for this update!" });
            return;
          }
          await updateOutward(editingId, {
            ...newOutward,
            qty: Number(newOutward.qty!),
          });
          await updateInventory(original.sku, {
            liveStock: inv.liveStock - qtyDiff
          });
        }
      } else {
        // Find the max ID to avoid duplicates
        const maxIdNum = outwards.reduce((max, o) => {
          const parts = o.id.split("-");
          const num = parseInt(parts[parts.length - 1] || "0");
          return num > max ? num : max;
        }, 0);

        const outward: Outward = {
          id: genId("MIS", maxIdNum),
          sku: newOutward.sku!,
          name: newOutward.name!,
          qty: Number(newOutward.qty!),
          unit: newOutward.unit!,
          date: todayStr(),
          location: newOutward.location!,
          handoverTo: newOutward.handoverTo!,
          project: newOutward.project,
          category: newOutward.category,
          materialPhotoUrl: newOutward.materialPhotoUrl,
          handoverPhotoUrl: newOutward.handoverPhotoUrl,
        };

        await addOutward(outward);
        await updateInventory(outward.sku, {
          liveStock: inv.liveStock - outward.qty,
        });
      }
      
      setModal(false);
      setIsEditing(false);
      setEditingId(null);
      setNewOutward(INITIAL_OUTWARD);
      setSearchItem("");
      setErrors({});
    } catch (error: any) {
      setErrors({ form: `Failed to process material issue: ${error.message}` });
    } finally {
      setModal(false);
      setIsEditing(false);
      setEditingId(null);
      setNewOutward(INITIAL_OUTWARD);
      setSearchItem("");
    }
  };

  const handleEdit = (out: Outward) => {
    setNewOutward(out);
    setEditingId(out.id);
    setIsEditing(true);
    setModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setErrors({});
    try {
      const out = deleteConfirm;
      const inv = inventory.find(i => i.sku === out.sku);
      if (inv) {
        await updateInventory(out.sku, {
          liveStock: inv.liveStock + out.qty
        });
      }
      await deleteOutward(out.id);
      setDeleteConfirm(null);
    } catch (error: any) {
      setErrors({ form: `Failed to delete: ${error.message}` });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const selectItem = (item: any) => {
    setNewOutward({
      ...newOutward,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      category: item.category,
    });
    setSearchItem("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outward & Material Issue"
        sub="Issue materials to site locations"
        actions={
          ["Super Admin", "Director", "Store Incharge"].includes(role || "") && (
            <Btn
              label="Issue Material"
              icon={Plus}
              onClick={() => {
                setNewOutward(INITIAL_OUTWARD);
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
                  MIS No.
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Category
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
                  Handover To
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Photos
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
              {outwards.map((out) => (
                <tr key={out.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {out.id}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {out.date}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {out.project || "-"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {out.category || "-"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1A1A2E] dark:text-white">
                    {out.name}{" "}
                    <span className="text-[11px] text-[#6B7280] dark:text-gray-500 block font-mono">
                      {out.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-right text-[#EF4444] dark:text-red-400">
                    - {out.qty} {out.unit}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {out.location}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {out.handoverTo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {out.materialPhotoUrl && (
                        <div 
                          className="w-8 h-8 rounded border border-[#E8ECF0] dark:border-gray-700 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewImage(out.materialPhotoUrl!)}
                          title="Material Photo"
                        >
                          <img src={out.materialPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      {out.handoverPhotoUrl && (
                        <div 
                          className="w-8 h-8 rounded border border-[#E8ECF0] dark:border-gray-700 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewImage(out.handoverPhotoUrl!)}
                          title="Handover Photo"
                        >
                          <img src={out.handoverPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      {!out.materialPhotoUrl && !out.handoverPhotoUrl && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-600 italic">No photos</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Btn
                        icon={Eye}
                        small
                        outline
                        onClick={() => {
                          setSelectedOutward(out);
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
                            onClick={() => handleEdit(out)}
                            title="Edit"
                          />
                          <Btn
                            icon={Trash2}
                            small
                            outline
                            color="red"
                            onClick={() => setDeleteConfirm(out)}
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
              {outwards.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-[13px]"
                  >
                    No materials issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {outwardsPagination && (
        <Pagination
          data={outwardsPagination}
          onPageChange={handlePageChange}
        />
      )}

      {viewModal && selectedOutward && (
        <Modal
          title={`Outward Report: ${selectedOutward.id}`}
          wide
          onClose={() => setViewModal(false)}
        >
          <div className="space-y-8 p-2">
            {/* Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedOutward.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Handover To</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedOutward.handoverTo}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Project</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedOutward.project}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Location</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">{selectedOutward.location}</p>
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
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    <tr className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-3 text-[12px] font-mono text-gray-500 dark:text-gray-400">{selectedOutward.sku}</td>
                      <td className="px-4 py-3 text-[13px] font-bold text-gray-900 dark:text-white">{selectedOutward.name}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-300">{selectedOutward.category}</td>
                      <td className="px-4 py-3 text-[13px] text-right font-bold text-red-600 dark:text-red-400">
                        -{selectedOutward.qty} {selectedOutward.unit}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Photos if available */}
            {(selectedOutward.materialPhotoUrl || selectedOutward.handoverPhotoUrl) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedOutward.materialPhotoUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Material Photo</p>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <img 
                        src={selectedOutward.materialPhotoUrl} 
                        className="w-full h-64 object-contain" 
                        referrerPolicy="no-referrer" 
                        alt="Material"
                      />
                    </div>
                  </div>
                )}
                {selectedOutward.handoverPhotoUrl && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Handover Photo</p>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <img 
                        src={selectedOutward.handoverPhotoUrl} 
                        className="w-full h-64 object-contain" 
                        referrerPolicy="no-referrer" 
                        alt="Handover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Btn label="Close" outline onClick={() => setViewModal(false)} />
              <Btn label="Download PDF" icon={Download} onClick={() => {/* TODO: Implement Outward PDF */}} />
            </div>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal 
          title={isEditing ? `Edit Material Issue (${editingId})` : "Issue Material (MIS)"} 
          onClose={() => {
            setModal(false);
            setNewOutward(INITIAL_OUTWARD);
            setSearchItem("");
            setErrors({});
          }}
        >
          <div className="space-y-4">
            {errors.form && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-[13px]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errors.form}
              </div>
            )}
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
                {errors.sku && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.sku}</p>
                )}
                {searchItem && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-[#E8ECF0] dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {inventory
                      .filter(
                        (i) =>
                          i.name
                            .toLowerCase()
                            .includes(searchItem.toLowerCase()) &&
                          i.liveStock > 0,
                      )
                      .map((i) => (
                        <div
                          key={i.sku}
                          onClick={() => selectItem(i)}
                          className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-[13px] flex justify-between"
                        >
                          <span className="text-gray-900 dark:text-white">
                            {i.name} ({i.sku})
                          </span>
                          <span className="font-bold text-[#10B981] dark:text-emerald-400">
                            {i.liveStock} {i.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {newOutward.sku && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-[#E8ECF0] dark:border-gray-700 rounded-lg mb-4">
                <p className="text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase">
                  Selected Item
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {newOutward.name}
                  </p>
                  <p className="text-[13px] font-bold text-[#10B981] dark:text-emerald-400">
                    Available:{" "}
                    {inventory.find((i) => i.sku === newOutward.sku)?.liveStock}{" "}
                    {newOutward.unit}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SField
                label="Project *"
                value={newOutward.project}
                onChange={(e: any) =>
                  setNewOutward(prev => ({ ...prev, project: e.target.value }))
                }
                options={PROJECTS}
                required
                error={errors.project}
              />
              <SField
                label="Category *"
                value={newOutward.category}
                onChange={(e: any) =>
                  setNewOutward(prev => ({ ...prev, category: e.target.value }))
                }
                options={CATEGORIES}
                required
                error={errors.category}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Quantity to Issue *"
                type="number"
                value={newOutward.qty}
                onChange={(e: any) =>
                  setNewOutward(prev => ({ ...prev, qty: e.target.value }))
                }
                required
                error={errors.qty}
              />
              <SField
                label="Unit *"
                value={newOutward.unit}
                onChange={(e: any) =>
                  setNewOutward(prev => ({ ...prev, unit: e.target.value }))
                }
                options={UNITS}
                required
                error={errors.unit}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SField
                label="Location *"
                value={newOutward.location}
                onChange={(e: any) =>
                  setNewOutward(prev => ({ ...prev, location: e.target.value }))
                }
                options={[
                  "Villa No.",
                  "Club House",
                  "Plant",
                  "G+10",
                  "Main Gate",
                  "Other",
                ]}
                required
                error={errors.location}
              />
              <Field
                label="Handover To *"
                value={newOutward.handoverTo}
                onChange={(e: any) =>
                  setNewOutward(prev => ({ ...prev, handoverTo: e.target.value }))
                }
                required
                error={errors.handoverTo}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUpload
                label="Material Photo"
                id="material-photo"
                value={newOutward.materialPhotoUrl}
                onChange={handleMaterialPhoto}
                loading={loadingField === "material"}
              />
              <ImageUpload
                label="Handover Photo"
                id="handover-photo"
                value={newOutward.handoverPhotoUrl}
                onChange={handleHandoverPhoto}
                loading={loadingField === "handover"}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Btn 
                label="Cancel" 
                outline 
                onClick={() => {
                  setModal(false);
                  setNewOutward(INITIAL_OUTWARD);
                  setSearchItem("");
                  setErrors({});
                }} 
              />
              <Btn
                label={loading ? "Processing..." : (isEditing ? "Update Issue" : "Generate MIS")}
                onClick={handleCreate}
                loading={actionLoading}
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
          title="Delete Outward Record"
          message={`This will delete the issue record for ${deleteConfirm.name} (${deleteConfirm.id}). Inventory stock will be restored by ${deleteConfirm.qty} ${deleteConfirm.unit}.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

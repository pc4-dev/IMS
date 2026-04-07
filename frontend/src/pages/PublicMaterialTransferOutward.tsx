import React, { useState, useEffect } from "react";
import { useAppStore } from "../store";
import { Card, Btn, Modal, Field, SField, ImageUpload } from "../components/ui";
import { Search, CheckCircle, AlertTriangle, Trash2, Plus } from "lucide-react";
import { MaterialTransferOutward, InventoryItem } from "../types";
import { genId, todayStr } from "../utils";
import { PROJECTS, CATEGORIES, UNITS } from "../data";
import { toast } from "react-hot-toast";

const INITIAL_TRANSFER: Partial<MaterialTransferOutward> = {
  fromLocation: "Garden city Store",
  toLocation: "",
  handoverTo: "",
  handoverPhotoUrl: "",
  remarks: "",
  module: "Public",
  items: [],
};

export const PublicMaterialTransferOutward = () => {
  const { 
    fetchPublicInventory, 
    submitPublicMaterialTransferOutward,
    uploadPublicImage,
    actionLoading
  } = useAppStore();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newTransfer, setNewTransfer] = useState<Partial<MaterialTransferOutward>>(INITIAL_TRANSFER);
  const [searchItem, setSearchItem] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const inv = await fetchPublicInventory();
        setInventory(inv);
      } catch (error) {
        toast.error("Failed to load inventory data");
      }
    };
    loadData();
  }, []);

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
      const { url } = await uploadPublicImage(file);
      updateItem(index, 'materialPhotoUrl', url);
      toast.success("Item photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleMaterialPhoto = async (file: File) => {
    setLoadingField("material");
    try {
      const { url } = await uploadPublicImage(file);
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
      const { url } = await uploadPublicImage(file);
      setNewTransfer(prev => ({ ...prev, handoverPhotoUrl: url }));
      toast.success("Handover photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm(newTransfer)) {
      toast.error("Please fill all required fields");
      return;
    }

    // Stock validation
    for (const item of newTransfer.items!) {
      const inv = inventory.find((i) => i.sku === item.sku);
      if (!inv || inv.liveStock < item.qty) {
        toast.error(`Insufficient stock for ${item.name}!`);
        return;
      }
    }

    const transfer: MaterialTransferOutward = {
      id: genId("PUB-MTO", Date.now() % 10000),
      date: todayStr(),
      fromLocation: newTransfer.fromLocation!,
      toLocation: newTransfer.toLocation!,
      handoverTo: newTransfer.handoverTo!,
      handoverPhotoUrl: newTransfer.handoverPhotoUrl,
      remarks: newTransfer.remarks,
      module: "Public",
      items: newTransfer.items as any[],
    };

    try {
      await submitPublicMaterialTransferOutward(transfer);
      setSubmitted(true);
      toast.success("Material Transfer record submitted successfully!");
    } catch (error: any) {
      setErrors({ form: `Failed to submit: ${error.message}` });
      toast.error("Submission failed");
    }
  };

  const selectItem = (item: any) => {
    setNewTransfer({
      ...newTransfer,
      sku: item.sku,
      name: item.itemName,
      unit: item.unit,
      category: item.category,
      project: item.lastProject || "",
    });
    setSearchItem("");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Successful!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your material transfer transaction has been recorded.
          </p>
          <Btn 
            label="Submit Another" 
            className="w-full"
            onClick={() => {
              setSubmitted(false);
              setNewTransfer(INITIAL_TRANSFER);
              setErrors({});
            }} 
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Material Transfer Outward Form</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Record materials transferred to other locations</p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="space-y-8">
            {errors.form && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-[13px]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errors.form}
              </div>
            )}
            
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
                    id="handover-photo-transfer-pub" 
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

            <div className="pt-4">
              <Btn
                label={actionLoading ? "Submitting..." : "Submit Transfer Record"}
                onClick={handleSubmit}
                loading={actionLoading}
                className="w-full py-3 text-lg"
              />
            </div>
          </div>
        </Card>
        
        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          Neoteric Store Management System - Public Entry Portal
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { useAppStore } from "../store";
import { Card, Btn, Modal, Field, SField, ImageUpload } from "../components/ui";
import { Search, CheckCircle, AlertTriangle } from "lucide-react";
import { Outward, InventoryItem } from "../types";
import { genId, todayStr } from "../utils";
import { PROJECTS, CATEGORIES, UNITS } from "../data";
import { toast } from "react-hot-toast";

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

export const PublicOutward = () => {
  const { 
    fetchPublicInventory, 
    submitPublicOutward,
    uploadPublicImage,
    actionLoading
  } = useAppStore();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newOutward, setNewOutward] = useState<Partial<Outward>>(INITIAL_OUTWARD);
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

  const handleMaterialPhoto = async (file: File) => {
    setLoadingField("material");
    try {
      const { url } = await uploadPublicImage(file);
      setNewOutward(prev => ({ ...prev, materialPhotoUrl: url }));
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
      setNewOutward(prev => ({ ...prev, handoverPhotoUrl: url }));
      toast.success("Handover photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm(newOutward)) {
      toast.error("Please fill all required fields");
      return;
    }

    const inv = inventory.find((i) => i.sku === newOutward.sku);
    if (!inv || inv.liveStock < newOutward.qty!) {
      setErrors({ qty: "Insufficient stock available!" });
      toast.error("Insufficient stock!");
      return;
    }

    const outward: Outward = {
      id: genId("PUB-MIS", Date.now() % 10000),
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

    try {
      await submitPublicOutward(outward);
      setSubmitted(true);
      toast.success("Material Issue record submitted successfully!");
    } catch (error: any) {
      setErrors({ form: `Failed to submit: ${error.message}` });
      toast.error("Submission failed");
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
            Your material issue transaction has been recorded.
          </p>
          <Btn 
            label="Submit Another" 
            className="w-full"
            onClick={() => {
              setSubmitted(false);
              setNewOutward(INITIAL_OUTWARD);
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
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Material Outward Form</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Record materials issued from the store</p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="space-y-6">
            {errors.form && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-[13px]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errors.form}
              </div>
            )}

            <div className="relative">
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
                      (i.name?.toLowerCase().includes(searchItem.toLowerCase()) ||
                      i.sku?.toLowerCase().includes(searchItem.toLowerCase())) &&
                      i.liveStock > 0
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

            {newOutward.sku && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-[#E8ECF0] dark:border-gray-700 rounded-lg">
                <p className="text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase">
                  Selected Item
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {newOutward.name}
                  </p>
                  <p className="text-[13px] font-bold text-[#10B981] dark:text-emerald-400">
                    Available: {inventory.find(i => i.sku === newOutward.sku)?.liveStock} {newOutward.unit}
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
              <Field
                label="Location *"
                value={newOutward.location}
                onChange={(e: any) =>
                  setNewOutward(prev => ({ ...prev, location: e.target.value }))
                }
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
                id="material-photo-out-pub"
                value={newOutward.materialPhotoUrl}
                onChange={handleMaterialPhoto}
                loading={loadingField === "material"}
              />
              <ImageUpload
                label="Handover Photo"
                id="handover-photo-out-pub"
                value={newOutward.handoverPhotoUrl}
                onChange={handleHandoverPhoto}
                loading={loadingField === "handover"}
              />
            </div>

            <div className="pt-4">
              <Btn
                label={actionLoading ? "Submitting..." : "Submit Issue Record"}
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

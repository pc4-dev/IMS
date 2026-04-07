import React, { useState, useEffect } from "react";
import { useAppStore } from "../store";
import { Card, Btn, Modal, Field, SField, ImageUpload } from "../components/ui";
import { Search, CheckCircle } from "lucide-react";
import { Inward, InventoryItem, Supplier } from "../types";
import { genId, todayStr } from "../utils";
import { PROJECTS, CATEGORIES } from "../data";
import { toast } from "react-hot-toast";

const INITIAL_INWARD: Partial<Inward> = {
  sku: "",
  name: "",
  qty: 0,
  unit: "",
  challanNo: "",
  mrNo: "",
  supplier: "",
  type: "Manual",
  project: "",
  category: "",
  materialPhotoUrl: "",
  personPhotoUrl: "",
};

export const PublicInward = () => {
  const { 
    fetchPublicInventory, 
    submitPublicInward,
    uploadPublicImage,
    actionLoading
  } = useAppStore();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newInward, setNewInward] = useState<Partial<Inward>>(INITIAL_INWARD);
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
        toast.error("Failed to load necessary data");
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
    if (!data.supplier) newErrors.supplier = "Supplier is required";
    if (!data.challanNo) newErrors.challanNo = "Challan/Invoice No. is required";
    if (!data.materialPhotoUrl) newErrors.materialPhotoUrl = "Material photo is required";
    if (!data.personPhotoUrl) newErrors.personPhotoUrl = "Challan/Invoice photo is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMaterialPhoto = async (file: File) => {
    setLoadingField("material");
    try {
      const { url } = await uploadPublicImage(file);
      setNewInward(prev => ({ ...prev, materialPhotoUrl: url }));
      toast.success("Material photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleChallanPhoto = async (file: File) => {
    setLoadingField("challan");
    try {
      const { url } = await uploadPublicImage(file);
      setNewInward(prev => ({ ...prev, personPhotoUrl: url }));
      toast.success("Challan/Invoice photo uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm(newInward)) {
      toast.error("Please fill all required fields");
      return;
    }

    const inward: Inward = {
      id: genId("PUB-INW", Date.now() % 10000),
      sku: newInward.sku!,
      name: newInward.name!,
      qty: Number(newInward.qty!),
      unit: newInward.unit!,
      date: todayStr(),
      challanNo: newInward.challanNo!,
      mrNo: newInward.mrNo!,
      supplier: newInward.supplier!,
      type: "Manual",
      project: newInward.project,
      category: newInward.category,
      materialPhotoUrl: newInward.materialPhotoUrl,
      personPhotoUrl: newInward.personPhotoUrl,
    };

    try {
      await submitPublicInward(inward);
      setSubmitted(true);
      toast.success("Inward record submitted successfully!");
    } catch (error: any) {
      setErrors({ form: `Failed to submit: ${error.message}` });
      toast.error("Submission failed");
    }
  };

  const selectItem = (item: any) => {
    setNewInward({
      ...newInward,
      sku: item.sku,
      name: item.itemName,
      unit: item.unit,
      project: item.lastProject || "",
      category: item.category || "",
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
            Your inward transaction has been recorded in the system.
          </p>
          <Btn 
            label="Submit Another" 
            className="w-full"
            onClick={() => {
              setSubmitted(false);
              setNewInward(INITIAL_INWARD);
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
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Material Inward Form</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Record materials received at the store</p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="space-y-6">
            {errors.form && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-[13px]">
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
                      i.itemName?.toLowerCase().includes(searchItem.toLowerCase()) ||
                      i.sku?.toLowerCase().includes(searchItem.toLowerCase())
                    )
                    .map((i) => (
                      <div
                        key={i.sku}
                        onClick={() => selectItem(i)}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-[13px] flex justify-between items-center"
                      >
                        <span className="text-gray-900 dark:text-white">{i.itemName} ({i.sku})</span>
                        <span className="font-bold text-[#10B981] dark:text-emerald-400">
                          {i.liveStock} {i.unit}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {newInward.sku && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-[#E8ECF0] dark:border-gray-700 rounded-lg">
                <p className="text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase">
                  Selected Item
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {newInward.name} ({newInward.sku})
                  </p>
                  <p className="text-[13px] font-bold text-[#10B981] dark:text-emerald-400">
                    Current Stock: {inventory.find(i => i.sku === newInward.sku)?.liveStock} {newInward.unit}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SField
                label="Project"
                value={newInward.project}
                onChange={(e: any) => setNewInward(prev => ({ ...prev, project: e.target.value }))}
                options={PROJECTS}
                required
                error={errors.project}
              />
              <SField
                label="Category"
                value={newInward.category}
                onChange={(e: any) => setNewInward(prev => ({ ...prev, category: e.target.value }))}
                options={CATEGORIES}
                required
                error={errors.category}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Quantity Received"
                type="number"
                value={newInward.qty}
                onChange={(e: any) =>
                  setNewInward(prev => ({ ...prev, qty: e.target.value }))
                }
                required
                error={errors.qty}
              />
              <Field
                label="Supplier"
                value={newInward.supplier}
                onChange={(e: any) =>
                  setNewInward(prev => ({ ...prev, supplier: e.target.value }))
                }
                required
                error={errors.supplier}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Challan / Invoice No."
                value={newInward.challanNo}
                onChange={(e: any) =>
                  setNewInward(prev => ({ ...prev, challanNo: e.target.value }))
                }
                required
                error={errors.challanNo}
              />
              <Field
                label="Material Receipt (MR) No."
                value={newInward.mrNo}
                onChange={(e: any) =>
                  setNewInward(prev => ({ ...prev, mrNo: e.target.value }))
                }
                error={errors.mrNo}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUpload
                label="Material Photo *"
                id="material-photo-pub"
                value={newInward.materialPhotoUrl}
                onChange={handleMaterialPhoto}
                loading={loadingField === "material"}
                error={errors.materialPhotoUrl}
              />
              <ImageUpload
                label="Challan / Invoice Photo *"
                id="challan-photo-pub"
                value={newInward.personPhotoUrl}
                onChange={handleChallanPhoto}
                loading={loadingField === "challan"}
                error={errors.personPhotoUrl}
              />
            </div>

            <div className="pt-4">
              <Btn
                label={actionLoading ? "Submitting..." : "Submit Inward Record"}
                onClick={handleSubmit}
                loading={actionLoading}
                color="green"
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

import React, { useState, useEffect } from "react";
import { 
  ArrowDownToLine, 
  Search, 
  Package, 
  MapPin, 
  User, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { useAppStore } from "../store";
import { MaterialTransferInward } from "../types";
import { Card, Btn } from "../components/ui";
import { todayStr } from "../utils";
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
  module: "Public",
};

export const PublicMaterialTransferInward = () => {
  const { 
    materialTransferOutwards, 
    fetchResource, 
    submitPublicMaterialTransferInward, 
    uploadPublicImage,
    actionLoading 
  } = useAppStore();

  const [newTransfer, setNewTransfer] = useState<Partial<MaterialTransferInward>>(INITIAL_TRANSFER);
  const [searchItem, setSearchItem] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchResource('material-transfer-outward');
  }, []);

  const validate = () => {
    const newErrors: any = {};
    if (!newTransfer.sku) newErrors.sku = "Required";
    if (!newTransfer.qty || newTransfer.qty <= 0) newErrors.qty = "Must be > 0";
    if (!newTransfer.location) newErrors.location = "Required";
    if (!newTransfer.receivedBy) newErrors.receivedBy = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'materialPhotoUrl' | 'personPhotoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(field);
    try {
      const res = await uploadPublicImage(file);
      setNewTransfer({ ...newTransfer, [field]: res.url });
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const transfer: MaterialTransferInward = {
        id: `MTI-PUB-${Date.now().toString().slice(-6)}`,
        sku: newTransfer.sku!,
        name: newTransfer.name!,
        qty: Number(newTransfer.qty!),
        unit: newTransfer.unit!,
        date: todayStr(),
        location: newTransfer.location!,
        receivedBy: newTransfer.receivedBy!,
        project: newTransfer.project,
        category: newTransfer.category,
        materialPhotoUrl: newTransfer.materialPhotoUrl,
        personPhotoUrl: newTransfer.personPhotoUrl,
        remarks: newTransfer.remarks,
        module: "Public",
      };

      await submitPublicMaterialTransferInward(transfer);
      setSubmitted(true);
      toast.success("Transfer recorded successfully");
    } catch (error: any) {
      setErrors({ form: error.message });
    }
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Successful!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              The material inward transfer has been recorded.
            </p>
          </div>
          <Btn 
            label="Submit Another" 
            className="w-full" 
            onClick={() => {
              setSubmitted(false);
              setNewTransfer(INITIAL_TRANSFER);
            }} 
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-600/20">
            <ArrowDownToLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Material Transfer Inward</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Public Submission Portal</p>
          </div>
        </div>

        <Card className="p-6 space-y-6 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Search MTO (SKU, Name or MTO No)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  placeholder="Search MTO records..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                />
              </div>
              {searchItem && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {materialTransferOutwards
                    .filter(item => 
                      item.sku.toLowerCase().includes(searchItem.toLowerCase()) ||
                      item.name.toLowerCase().includes(searchItem.toLowerCase()) ||
                      item.id.toLowerCase().includes(searchItem.toLowerCase())
                    )
                    .map(item => (
                      <button
                        key={item.id}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
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
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">Selected Item</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{newTransfer.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{newTransfer.sku}</p>
                </div>
                <Btn 
                  icon={ArrowLeft} 
                  small 
                  outline 
                  label="Change" 
                  onClick={() => setNewTransfer({ ...newTransfer, sku: "" })} 
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${errors.qty ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                  value={newTransfer.qty || ""}
                  onChange={(e) => setNewTransfer({ ...newTransfer, qty: Number(e.target.value) })}
                  placeholder="0.00"
                />
                {errors.qty && <p className="text-[10px] text-red-500 mt-1">{errors.qty}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${errors.location ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20`}
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
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${errors.receivedBy ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                value={newTransfer.receivedBy}
                onChange={(e) => setNewTransfer({ ...newTransfer, receivedBy: e.target.value })}
                placeholder="Person name"
              />
              {errors.receivedBy && <p className="text-[10px] text-red-500 mt-1">{errors.receivedBy}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Material Photo
                </label>
                <div className="relative group aspect-video rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-green-500 transition-colors">
                  {newTransfer.materialPhotoUrl ? (
                    <>
                      <img src={newTransfer.materialPhotoUrl} className="w-full h-full object-cover" alt="Material" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Btn icon={Camera} small label="Change" onClick={() => (document.getElementById('mat-photo') as HTMLInputElement).click()} />
                      </div>
                    </>
                  ) : (
                    <>
                      {uploading === 'materialPhotoUrl' ? (
                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-400" />
                          <span className="text-xs text-gray-500">Click to upload</span>
                        </>
                      )}
                      <input id="mat-photo" type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'materialPhotoUrl')} />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Person Photo
                </label>
                <div className="relative group aspect-video rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-green-500 transition-colors">
                  {newTransfer.personPhotoUrl ? (
                    <>
                      <img src={newTransfer.personPhotoUrl} className="w-full h-full object-cover" alt="Person" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Btn icon={Camera} small label="Change" onClick={() => (document.getElementById('per-photo') as HTMLInputElement).click()} />
                      </div>
                    </>
                  ) : (
                    <>
                      {uploading === 'personPhotoUrl' ? (
                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-400" />
                          <span className="text-xs text-gray-500">Click to upload</span>
                        </>
                      )}
                      <input id="per-photo" type="file" accept="image/*" capture="user" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'personPhotoUrl')} />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Remarks
              </label>
              <textarea
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 min-h-[100px]"
                value={newTransfer.remarks}
                onChange={(e) => setNewTransfer({ ...newTransfer, remarks: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>

            {errors.form && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-5 h-5" />
                {errors.form}
              </div>
            )}

            <Btn 
              label="Submit Inward Transfer" 
              className="w-full py-4 text-base shadow-xl shadow-green-600/20" 
              onClick={handleSubmit} 
              loading={actionLoading}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

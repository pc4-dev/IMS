import React, { useState, useEffect } from "react";
import { 
  ArrowDownLeft, 
  Search, 
  User, 
  Camera, 
  Check, 
  AlertCircle,
  Plus,
  Trash2
} from "lucide-react";
import { useAppStore } from "../store";
import { MaterialTransferInward } from "../types";
import { Btn } from "../components/ui";
import { todayStr } from "../utils";
import { toast } from "react-hot-toast";

const INITIAL_TRANSFER: Partial<MaterialTransferInward> = {
  location: "Garden city Store",
  receivedBy: "",
  handoverPhotoUrl: "",
  remarks: "",
  module: "Public",
  items: [],
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchResource('material-transfer-outward');
  }, [fetchResource]);

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

  const handleFileUpload = async (index: number, file: File) => {
    setUploading(`item-${index}`);
    try {
      const res = await uploadPublicImage(file);
      updateItem(index, 'materialPhotoUrl', res.url);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(null);
    }
  };

  const handleHandoverUpload = async (file: File) => {
    setUploading('handover');
    try {
      const res = await uploadPublicImage(file);
      setNewTransfer(prev => ({ ...prev, handoverPhotoUrl: res.url }));
      toast.success("Handover photo uploaded");
    } catch (error) {
      toast.error("Failed to upload handover photo");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!validate(newTransfer)) return;

    try {
      const transfer: MaterialTransferInward = {
        id: `MTI-PUB-${Date.now().toString().slice(-6)}`,
        date: todayStr(),
        location: newTransfer.location!,
        receivedBy: newTransfer.receivedBy!,
        handoverPhotoUrl: newTransfer.handoverPhotoUrl,
        remarks: newTransfer.remarks,
        module: "Public",
        items: newTransfer.items as any[],
      };

      await submitPublicMaterialTransferInward(transfer);
      setSubmitted(true);
      toast.success("Transfer recorded successfully");
    } catch (error: any) {
      setErrors({ form: error.message });
    }
  };

  const selectItem = (index: number, item: any) => {
    updateItem(index, 'sku', item.sku);
    updateItem(index, 'name', item.name);
    updateItem(index, 'unit', item.unit);
    updateItem(index, 'category', item.category);
    updateItem(index, 'qty', item.qty);
    setSearchItem("");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Transfer Recorded!</h2>
            <p className="text-gray-500">The inward material transfer has been successfully logged.</p>
          </div>
          <Btn label="Record Another" onClick={() => { setSubmitted(false); setNewTransfer(INITIAL_TRANSFER); }} className="w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <ArrowDownLeft className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Inward Transfer</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Public Entry Form</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
            <p className="text-sm font-bold text-gray-900">{todayStr()}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Receiving Location</label>
              <select
                className={`w-full px-4 py-3 bg-gray-50 border ${errors.location ? 'border-red-500' : 'border-gray-100'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold`}
                value={newTransfer.location}
                onChange={(e) => setNewTransfer({ ...newTransfer, location: e.target.value })}
              >
                <option value="Garden city Store">Garden city Store</option>
                <option value="Project Site A">Project Site A</option>
                <option value="Project Site B">Project Site B</option>
              </select>
              {errors.location && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.location}</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Received By</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border ${errors.receivedBy ? 'border-red-500' : 'border-gray-100'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold`}
                  placeholder="Enter your name"
                  value={newTransfer.receivedBy}
                  onChange={(e) => setNewTransfer({ ...newTransfer, receivedBy: e.target.value })}
                />
              </div>
              {errors.receivedBy && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.receivedBy}</p>}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Materials Received</h3>
            <Btn icon={Plus} label="Add Item" small onClick={addItem} />
          </div>

          <div className="space-y-4">
            {newTransfer.items?.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 relative">
                {index > 0 && (
                  <button 
                    onClick={() => removeItem(index)}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Search Outward Item</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        placeholder="Search by SKU or Name..."
                        onChange={(e) => setSearchItem(e.target.value)}
                      />
                      {searchItem && (
                        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto">
                          {materialTransferOutwards
                            .flatMap(mto => mto.items || [])
                            .filter(i => 
                              i.sku.toLowerCase().includes(searchItem.toLowerCase()) || 
                              i.name.toLowerCase().includes(searchItem.toLowerCase())
                            )
                            .map((i, idx) => (
                              <button
                                key={idx}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                onClick={() => selectItem(index, i)}
                              >
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{i.name}</p>
                                  <p className="text-[10px] text-gray-500 font-mono">{i.sku}</p>
                                </div>
                                <p className="text-[10px] font-bold text-green-600">{i.qty} {i.unit}</p>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Quantity</label>
                      <input
                        type="number"
                        className={`w-full px-4 py-2 bg-white border ${errors[`item-${index}-qty`] ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold`}
                        value={item.qty || ""}
                        onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Unit</label>
                      <input
                        type="text"
                        readOnly
                        className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500"
                        value={item.unit}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Item Name</label>
                    <input
                      type="text"
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500"
                      value={item.name}
                      placeholder="Select an item first"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Material Photo</label>
                    <div className="relative h-10 rounded-xl border-2 border-dashed border-gray-200 bg-white flex items-center justify-center overflow-hidden group">
                      {item.materialPhotoUrl ? (
                        <>
                          <img src={item.materialPhotoUrl} className="w-full h-full object-cover" alt="Item" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Btn icon={Camera} small label="Change" onClick={() => (document.getElementById(`item-photo-${index}`) as HTMLInputElement).click()} />
                          </div>
                        </>
                      ) : (
                        <>
                          {uploading === `item-${index}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Camera className="w-4 h-4 text-gray-400" />
                              <span className="text-[10px] text-gray-500 font-bold uppercase">Upload</span>
                            </div>
                          )}
                          <input 
                            id={`item-photo-${index}`}
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(index, e.target.files[0])}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {errors.items && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.items}</p>}
          </div>
        </div>

        {/* Photos & Remarks */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Handover Photo (Optional)</label>
              <div className="relative aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 overflow-hidden group">
                {newTransfer.handoverPhotoUrl ? (
                  <>
                    <img src={newTransfer.handoverPhotoUrl} className="w-full h-full object-cover" alt="Handover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Btn icon={Camera} small label="Change" onClick={() => (document.getElementById('handover-photo') as HTMLInputElement).click()} />
                    </div>
                  </>
                ) : (
                  <>
                    {uploading === 'handover' ? (
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
                      onChange={(e) => e.target.files?.[0] && handleHandoverUpload(e.target.files[0])}
                    />
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Remarks</label>
              <textarea
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 h-[140px]"
                placeholder="Any additional notes..."
                value={newTransfer.remarks}
                onChange={(e) => setNewTransfer({ ...newTransfer, remarks: e.target.value })}
              />
            </div>
          </div>

          {errors.form && (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5" />
              {errors.form}
            </div>
          )}

          <Btn
            label={actionLoading ? "Processing..." : "Submit Inward Transfer"}
            className="w-full py-4 text-lg"
            onClick={handleSubmit}
            disabled={actionLoading}
          />
        </div>
      </div>
    </div>
  );
};

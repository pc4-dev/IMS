import React, { useState, useEffect } from "react";
import { 
  FileText, 
  CheckCircle2, 
  Search, 
  Trash2, 
  Package, 
  Building2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useAppStore } from "../store";
import { PurchaseOrder, POLineItem, CatalogueEntry, Supplier } from "../types";
import { Card, Btn, Field, SField } from "../components/ui";
import { todayStr, fmtCur } from "../utils";
import { PROJECTS } from "../data";
import { toast } from "react-hot-toast";

export const PublicPurchaseOrder = () => {
  const { 
    submitPublicPO,
    fetchPublicCatalogue,
    fetchPublicInventory,
    fetchPublicSuppliers,
    actionLoading 
  } = useAppStore();

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [errors, setErrors] = useState<any>({});
  
  const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>({
    project: "",
    phase: "",
    workType: "",
    milestone: "",
    supplier: "",
    items: [],
    justification: "",
    priority: "Normal",
    applicatedArea: "",
    requirementBy: "",
    location: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catData, invData, supData] = await Promise.all([
          fetchPublicCatalogue(),
          fetchPublicInventory(),
          fetchPublicSuppliers()
        ]);
        setCatalogue(catData || []);
        setInventory(invData || []);
        setSuppliers(supData || []);
      } catch (error) {
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const validate = () => {
    const newErrors: any = {};
    if (!newPO.project) newErrors.project = "Required";
    if (!newPO.phase) newErrors.phase = "Required";
    if (!newPO.milestone) newErrors.milestone = "Required";
    if (!newPO.supplier) newErrors.supplier = "Required";
    if (!newPO.items || newPO.items.length === 0) newErrors.items = "Add at least one item";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addItem = (item: CatalogueEntry) => {
    const existing = newPO.items?.find(i => i.sku === item.sku);
    if (existing) {
      toast.error("Item already added");
      return;
    }

    const inv = inventory.find(i => i.sku === item.sku);
    const newItem: POLineItem = {
      sku: item.sku,
      name: item.name,
      qty: 1,
      unit: item.uom || (inv ? inv.unit : ''),
      rate: 0,
      gstPct: 18,
      total: 0,
      totalWithGST: 0,
      category: item.category || (inv ? inv.category : ''),
      currentStock: inv ? inv.liveStock : 0,
      requirementQty: 1
    };

    setNewPO({
      ...newPO,
      items: [...(newPO.items || []), newItem]
    });
    setSearchItem("");
  };

  const updateItem = (sku: string, field: keyof POLineItem, value: any) => {
    const updatedItems = newPO.items?.map(item => {
      if (item.sku === sku) {
        const updated = { ...item, [field]: value };
        updated.total = updated.qty * updated.rate;
        updated.totalWithGST = updated.total * (1 + updated.gstPct / 100);
        return updated;
      }
      return item;
    });
    setNewPO({ ...newPO, items: updatedItems });
  };

  const removeItem = (sku: string) => {
    setNewPO({
      ...newPO,
      items: newPO.items?.filter(i => i.sku !== sku)
    });
  };

  const calculateTotal = () => {
    return newPO.items?.reduce((sum, item) => sum + item.totalWithGST, 0) || 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const po: PurchaseOrder = {
      id: `PO-PUB-${Date.now().toString().slice(-6)}`,
      project: newPO.project!,
      phase: newPO.phase || "N/A",
      workType: newPO.workType || "N/A",
      milestone: newPO.milestone || "N/A",
      supplier: newPO.supplier!,
      items: newPO.items as POLineItem[],
      totalValue: calculateTotal(),
      status: "Pending L1",
      approvalL1: "Pending",
      approvalL2: "Pending",
      justification: newPO.justification,
      createdBy: "Public Portal",
      date: todayStr(),
      priority: newPO.priority as any,
      applicatedArea: newPO.applicatedArea,
      requirementBy: newPO.requirementBy,
      location: newPO.location,
    };

    try {
      await submitPublicPO(po);
      setSubmitted(true);
      toast.success("Purchase Order submitted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit Purchase Order");
    }
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
              Your Purchase Order has been submitted for review.
            </p>
          </div>
          <Btn 
            label="Submit Another" 
            className="w-full" 
            onClick={() => {
              setSubmitted(false);
              setNewPO({
                project: "",
                phase: "",
                workType: "",
                milestone: "",
                supplier: "",
                items: [],
                justification: "",
                priority: "Normal",
                applicatedArea: "",
                requirementBy: "",
                location: "",
              });
            }} 
          />
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Card className="p-8 space-y-8 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 bg-[#F97316] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Purchase Order</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Public Submission Portal</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Top Grid Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <SField
                label="PROJECT"
                value={newPO.project}
                onChange={(e: any) => setNewPO({ ...newPO, project: e.target.value })}
                options={PROJECTS}
                placeholder="Choose Project"
                required
                error={errors.project}
              />
              <Field
                label="PHASE/BLOCK"
                value={newPO.phase}
                onChange={(e: any) => setNewPO({ ...newPO, phase: e.target.value })}
                placeholder="Enter Phase/Block"
                required
                error={errors.phase}
              />
              <Field
                label="MILESTONE"
                value={newPO.milestone}
                onChange={(e: any) => setNewPO({ ...newPO, milestone: e.target.value })}
                placeholder="Enter Milestone"
                required
                error={errors.milestone}
              />
              <SField
                label="SUPPLIER"
                value={newPO.supplier}
                onChange={(e: any) => setNewPO({ ...newPO, supplier: e.target.value })}
                options={suppliers.map(v => v.name)}
                placeholder="Choose Supplier"
                required
                error={errors.supplier}
              />
              <Field
                label="LOCATION"
                value={newPO.location}
                onChange={(e: any) => setNewPO({ ...newPO, location: e.target.value })}
                placeholder="Enter Location"
              />
              <Field
                label="REQUIREMENT BY"
                value={newPO.requirementBy}
                onChange={(e: any) => setNewPO({ ...newPO, requirementBy: e.target.value })}
                placeholder="Enter Name"
              />
              <Field
                label="APPLICATED AREA"
                value={newPO.applicatedArea}
                onChange={(e: any) => setNewPO({ ...newPO, applicatedArea: e.target.value })}
                placeholder="Enter Area"
              />
              <SField
                label="PRIORITY"
                value={newPO.priority}
                onChange={(e: any) => setNewPO({ ...newPO, priority: e.target.value })}
                options={["Normal", "Urgent", "Low"]}
              />
            </div>

            {/* Line Items Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Line Items</h3>
              
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search inventory to add items..."
                    value={searchItem}
                    onChange={(e) => setSearchItem(e.target.value)}
                  />
                </div>
                {searchItem && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {[
                      ...catalogue.map(c => ({ ...c, source: 'catalogue' })),
                      ...inventory.map(i => ({ 
                        sku: i.sku, 
                        name: i.itemName, 
                        category: i.category, 
                        uom: i.unit,
                        source: 'inventory' 
                      }))
                    ]
                      .filter((item, index, self) => 
                        self.findIndex(t => t.sku === item.sku) === index
                      )
                      .filter(item => 
                        item.name.toLowerCase().includes(searchItem.toLowerCase()) ||
                        item.sku.toLowerCase().includes(searchItem.toLowerCase())
                      )
                      .map(item => (
                        <button
                          key={item.sku}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
                          onClick={() => addItem({
                            sku: item.sku,
                            name: item.name,
                            category: item.category,
                            uom: (item as any).uom || (item as any).unit || '',
                            brand: (item as any).brand || '',
                            description: (item as any).description || '',
                            location: (item as any).location || '',
                            minStock: (item as any).minStock || 0,
                            imageUrl: (item as any).imageUrl || '',
                            status: 'Approved'
                          })}
                        >
                          <div className="font-bold text-[#1A1A2E] dark:text-white">{item.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{item.sku} • {item.category} • {(item as any).uom || (item as any).unit}</div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-center">Stock</th>
                      <th className="px-3 py-2 text-center">Unit</th>
                      <th className="px-3 py-2 text-center">Req Qty</th>
                      <th className="px-3 py-2 text-center">Order Qty</th>
                      <th className="px-3 py-2 text-center">Rate</th>
                      <th className="px-3 py-2 text-center">GST %</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {newPO.items?.map((item) => (
                      <tr key={item.sku} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-3 py-3">
                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{item.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{item.sku}</p>
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                          {item.currentStock}
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                          {item.unit}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            className="w-16 px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm text-center focus:ring-1 focus:ring-orange-500 outline-none"
                            value={item.requirementQty}
                            onChange={(e) => updateItem(item.sku, 'requirementQty', Number(e.target.value))}
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            className="w-16 px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm text-center focus:ring-1 focus:ring-orange-500 outline-none"
                            value={item.qty}
                            onChange={(e) => updateItem(item.sku, 'qty', Number(e.target.value))}
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            className="w-24 px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm text-center focus:ring-1 focus:ring-orange-500 outline-none"
                            value={item.rate}
                            onChange={(e) => updateItem(item.sku, 'rate', Number(e.target.value))}
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <select
                            className="px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                            value={item.gstPct}
                            onChange={(e) => updateItem(item.sku, 'gstPct', Number(e.target.value))}
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                          ₹{item.totalWithGST.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button 
                            onClick={() => removeItem(item.sku)} 
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(!newPO.items || newPO.items.length === 0) && (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                  <Package className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No items added yet</p>
                </div>
              )}
            </div>

            {/* Justification */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Justification</label>
              <textarea
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${errors.justification ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px]`}
                value={newPO.justification}
                onChange={(e) => setNewPO({ ...newPO, justification: e.target.value })}
                placeholder="Why is this needed?"
              />
              {errors.justification && <p className="text-[10px] text-red-500 font-bold">{errors.justification}</p>}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col items-end gap-2 mr-auto">
                <span className="text-sm font-bold text-gray-500 uppercase">Total Value</span>
                <span className="text-2xl font-black text-[#F97316]">{fmtCur(calculateTotal())}</span>
              </div>
              <Btn 
                label="Submit PO" 
                className="bg-[#F97316] hover:bg-[#EA580C] text-white border-none px-12 py-4 text-lg shadow-xl shadow-orange-600/20" 
                onClick={handleSubmit} 
                loading={actionLoading}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

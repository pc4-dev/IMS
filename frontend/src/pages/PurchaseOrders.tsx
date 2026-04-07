import React, { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../store";
import {
  PageHeader,
  Card,
  StatusBadge,
  Btn,
  Modal,
  Field,
  SField,
  Pagination,
  Skeleton,
  ConfirmModal,
} from "../components/ui";
import {
  Plus,
  FileText,
  Search,
  Trash2,
  Package,
  Building2,
  AlertCircle,
  Eye,
  Edit2,
} from "lucide-react";
import { PurchaseOrder, POLineItem, CatalogueEntry, Supplier } from "../types";
import { fmtCur, genId, todayStr } from "../utils";
import { PROJECTS } from "../data";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const PurchaseOrders = () => {
  const { 
    pos, 
    posPagination,
    fetchResource,
    addPO, 
    updatePO, 
    deletePO, 
    role, 
    inventory, 
    suppliers, 
    catalogue,
    settings,
    loading,
    actionLoading
  } = useAppStore();
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchItem, setSearchItem] = useState("");
  const [poSearchTerm, setPoSearchTerm] = useState("");
  const canEdit = ["Super Admin", "Director", "Project Manager"].includes(role || "");

  useEffect(() => {
    // Only show skeleton if we have no data
    const isInitialLoad = pos.length === 0;
    fetchResource('pos', 1, 50, !isInitialLoad);
  }, [fetchResource]);

  const handlePageChange = useCallback((page: number) => {
    fetchResource('pos', page);
  }, [fetchResource]);

  const initialPO: Partial<PurchaseOrder> = {
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
  };

  const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>(initialPO);

  const validateForm = () => {
    const newErrors: any = {};
    if (!newPO.project) newErrors.project = "Project is required";
    if (!newPO.phase) newErrors.phase = "Phase is required";
    if (!newPO.milestone) newErrors.milestone = "Milestone is required";
    if (!newPO.supplier) newErrors.supplier = "Supplier is required";
    if (!newPO.items || newPO.items.length === 0) newErrors.items = "Add at least one item";

    // Reusable stock check
    const hasReusable = newPO.items?.some((i: any) => {
      const inv = inventory.find((inv) => inv.sku === i.sku);
      return (
        inv &&
        ["Good", "Needs Repair"].includes(inv.condition) &&
        inv.liveStock > 0
      );
    });

    if (hasReusable && !newPO.justification) {
      newErrors.justification = "Justification is required for ordering items with reusable stock available";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addItem = (item: CatalogueEntry) => {
    const existing = newPO.items?.find((i) => i.sku === item.sku);
    if (existing) {
      toast.error("Item already added");
      return;
    }

    const inv = inventory.find((i) => i.sku === item.sku);
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
      requirementQty: 1,
    };

    setNewPO({
      ...newPO,
      items: [...(newPO.items || []), newItem],
    });
    setSearchItem("");
  };

  const updateItem = (sku: string, field: keyof POLineItem, value: any) => {
    const updatedItems = newPO.items?.map((item) => {
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
      items: newPO.items?.filter((i) => i.sku !== sku),
    });
  };

  const calculateTotal = () => {
    return newPO.items?.reduce((sum, item) => sum + item.totalWithGST, 0) || 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    const totalValue = calculateTotal();
    const isAutoApproved = totalValue <= settings.poThreshold;

    const poData: PurchaseOrder = {
      id: newPO.id || `PO-${Date.now().toString().slice(-6)}`,
      project: newPO.project!,
      phase: newPO.phase || "N/A",
      workType: newPO.workType || "N/A",
      milestone: newPO.milestone || "N/A",
      supplier: newPO.supplier!,
      items: newPO.items as POLineItem[],
      totalValue: totalValue,
      status: isAutoApproved ? "Approved" : "Pending L1",
      approvalL1: isAutoApproved ? "Approved" : "Pending",
      approvalL2: isAutoApproved ? "Approved" : "Pending",
      justification: newPO.justification,
      createdBy: role!,
      date: newPO.date || todayStr(),
      priority: newPO.priority as any,
      applicatedArea: newPO.applicatedArea,
      requirementBy: newPO.requirementBy,
      location: newPO.location,
    };

    if (isEditing && newPO.id) {
      try {
        await updatePO(newPO.id, poData);
        toast.success("Purchase Order updated successfully");
        setModal(false);
        setNewPO(initialPO);
        setIsEditing(false);
        setErrors({});
      } catch (error: any) {
        toast.error(`Failed to update PO: ${error.message}`);
      }
      return;
    }

    // Find the max ID to avoid duplicates
    const maxIdNum = pos.reduce((max, p) => {
      const parts = p.id.split("-");
      const num = parseInt(parts[parts.length - 1] || "0");
      return num > max ? num : max;
    }, 0);

    const finalPO: PurchaseOrder = {
      ...poData,
      id: genId("PO", maxIdNum),
    };

    try {
      await addPO(finalPO);
      toast.success("Purchase Order created successfully");
      setModal(false);
      setNewPO(initialPO);
      setErrors({});
    } catch (error: any) {
      toast.error(`Failed to create PO: ${error.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePO(deleteConfirm);
      toast.success("Purchase Order deleted successfully");
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(`Failed to delete PO: ${error.message}`);
    }
  };

  const handleApproveL1 = async (id: string) => {
    try {
      await updatePO(id, { approvalL1: "Approved", status: "Pending L2" });
      toast.success("L1 Approval successful");
    } catch (error: any) {
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const handleApproveL2 = async (id: string) => {
    try {
      await updatePO(id, { approvalL2: "Approved", status: "Pending Account" });
      toast.success("L2 Approval successful. Sent to Accounts.");
    } catch (error: any) {
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const handleApproveAccount = async (id: string) => {
    try {
      await updatePO(id, { status: "Approved" });
      toast.success("Account Approval successful. PO is now Approved.");
    } catch (error: any) {
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updatePO(id, { status: "Blocked" });
      toast.success("PO rejected successfully");
    } catch (error: any) {
      toast.error(`Rejection failed: ${error.message}`);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updatePO(id, { status: "Blocked" });
      toast.success("PO cancelled successfully");
    } catch (error: any) {
      toast.error(`Cancellation failed: ${error.message}`);
    }
  };

  const downloadPDF = (po: PurchaseOrder) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22); // Orange color
    doc.text("Neoteric Group", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("APNO KE LIYE. SAPNO KE LIYE.", 14, 28);
    
    doc.setFontSize(16);
    doc.setTextColor(26, 26, 46);
    doc.text("PURCHASE ORDER", 14, 45);
    
    // PO Details
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`PO Number: ${po.id}`, 14, 55);
    doc.text(`Date: ${po.date}`, 14, 61);
    doc.text(`Project: ${po.project}`, 14, 67);
    doc.text(`Supplier: ${po.supplier}`, 14, 73);
    doc.text(`Status: ${po.status}`, 14, 79);
    
    // Table
    const tableData = po.items.map((item, idx) => [
      idx + 1,
      item.name,
      item.sku,
      item.qty,
      item.unit,
      fmtCur(item.rate),
      `${item.gstPct}%`,
      fmtCur(item.totalWithGST)
    ]);
    
    autoTable(doc, {
      startY: 90,
      head: [['Sr.', 'Item Name', 'SKU', 'Qty', 'Unit', 'Rate', 'GST', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] }, // Orange theme
      foot: [['', '', '', '', '', '', 'Total Value', fmtCur(po.totalValue)]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    if (po.justification) {
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Justification:", 14, finalY + 15);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(po.justification, 14, finalY + 22, { maxWidth: 180 });
    }
    
    doc.save(`PO_${po.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        sub="Manage and approve POs"
        actions={
          canEdit && (
            <Btn
              label="Create PO"
              icon={Plus}
              onClick={() => {
                setNewPO(initialPO);
                setIsEditing(false);
                setModal(true);
              }}
            />
          )
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ID, Project, Supplier, or Status..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
          value={poSearchTerm}
          onChange={(e) => setPoSearchTerm(e.target.value)}
        />
      </div>

      <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PO No.
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Value
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : pos.filter(po => {
                const term = poSearchTerm.toLowerCase();
                return (
                  po.id.toLowerCase().includes(term) ||
                  po.project.toLowerCase().includes(term) ||
                  po.supplier.toLowerCase().includes(term) ||
                  po.status.toLowerCase().includes(term)
                );
              }).length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FileText className="w-12 h-12 opacity-20" />
                      <p className="text-sm">No purchase orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pos.filter(po => {
                  const term = poSearchTerm.toLowerCase();
                  return (
                    po.id.toLowerCase().includes(term) ||
                    po.project.toLowerCase().includes(term) ||
                    po.vendor.toLowerCase().includes(term) ||
                    po.status.toLowerCase().includes(term)
                  );
                }).map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-medium text-gray-900 dark:text-white">
                      {po.id}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400">
                      {po.date}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 max-w-[200px]">
                      <div className="truncate" title={po.items.map(i => `${i.name} (${i.sku})`).join(", ")}>
                        {po.items.map(i => `${i.name} (${i.sku})`).join(", ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400">
                      {po.project}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400">
                      {po.supplier}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-right text-gray-900 dark:text-white">
                      {fmtCur(po.totalValue)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <div className="inline-flex items-center gap-2 mr-2">
                        {(role === "AGM" || role === "Super Admin") && po.status === "Pending L1" && (
                          <>
                            <Btn
                              label="Approve L1"
                              small
                              color="green"
                              onClick={() => handleApproveL1(po.id)}
                              loading={actionLoading}
                            />
                            <Btn
                              label="Reject"
                              small
                              color="red"
                              onClick={() => handleReject(po.id)}
                              loading={actionLoading}
                            />
                          </>
                        )}
                        {(role === "Director" || role === "Super Admin") && po.status === "Pending L2" && (
                          <>
                            <Btn
                              label="Approve L2"
                              small
                              color="green"
                              onClick={() => handleApproveL2(po.id)}
                              loading={actionLoading}
                            />
                            <Btn
                              label="Reject"
                              small
                              color="red"
                              onClick={() => handleReject(po.id)}
                              loading={actionLoading}
                            />
                          </>
                        )}
                        {(role === "Accountant" || role === "Super Admin") && po.status === "Pending Account" && (
                          <>
                            <Btn
                              label="Approve Account"
                              small
                              color="green"
                              onClick={() => handleApproveAccount(po.id)}
                              loading={actionLoading}
                            />
                            <Btn
                              label="Reject"
                              small
                              color="red"
                              onClick={() => handleReject(po.id)}
                              loading={actionLoading}
                            />
                          </>
                        )}
                        {role === "Director" && po.status === "Approved" && (
                          <Btn
                            label="Cancel"
                            small
                            color="red"
                            outline
                            onClick={() => handleCancel(po.id)}
                            loading={actionLoading}
                          />
                        )}
                      </div>

                      <Btn
                        icon={Eye}
                        small
                        outline
                        onClick={() => {
                          setSelectedPO(po);
                          setViewModal(true);
                        }}
                        title="View"
                      />
                      {canEdit && (
                        <>
                          <Btn
                            icon={Edit2}
                            small
                            outline
                            onClick={() => {
                              setNewPO(po);
                              setIsEditing(true);
                              setModal(true);
                            }}
                            title="Edit"
                          />
                          <Btn
                            icon={Trash2}
                            small
                            outline
                            color="red"
                            onClick={() => setDeleteConfirm(po.id)}
                            title="Delete"
                          />
                        </>
                      )}
                      <Btn
                        icon={FileText}
                        small
                        outline
                        onClick={() => downloadPDF(po)}
                        title="Download PDF"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {posPagination && (
        <Pagination
          data={posPagination}
          onPageChange={handlePageChange}
        />
      )}

      {modal && (
        <Modal
          title={isEditing ? "Edit Purchase Order" : "Create Purchase Order"}
          wide
          onClose={() => {
            setModal(false);
            setErrors({});
          }}
        >
          <div className="space-y-8 p-2">
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
            </div>

            {/* Justification - keeping it but making it less prominent if it's not in screenshot */}
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
              <Btn 
                label="Cancel" 
                outline
                onClick={() => setModal(false)} 
              />
              <Btn 
                label={isEditing ? "Update PO" : "Create PO"} 
                className="bg-[#F97316] hover:bg-[#EA580C] text-white border-none px-8" 
                onClick={handleFormSubmit} 
                loading={actionLoading}
              />
            </div>
          </div>
        </Modal>
      )}

      {viewModal && selectedPO && (
        <Modal
          title={`Purchase Order Details - ${selectedPO.id}`}
          wide
          onClose={() => {
            setViewModal(false);
            setSelectedPO(null);
          }}
        >
          <div className="overflow-x-auto">
            <div id="printable-po" className="border border-gray-300 dark:border-gray-700 text-[11px] font-sans text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 min-w-[800px]">
            {/* Header Section */}
            <div className="grid grid-cols-12 border-b border-gray-300 dark:border-gray-700">
              <div className="col-span-2 p-2 border-r border-gray-300 dark:border-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-orange-500 font-black text-lg leading-none">Neoteric</p>
                  <p className="text-gray-900 dark:text-white font-bold text-[10px] tracking-tighter">PROPERTIES</p>
                  <p className="text-[6px] text-gray-400 mt-0.5">APNO KE LIYE. SAPNO KE LIYE.</p>
                </div>
              </div>
              <div className="col-span-7 p-2 border-r border-gray-300 dark:border-gray-700 text-center flex flex-col justify-center">
                <h2 className="font-bold text-[14px] underline tracking-wide uppercase text-gray-900 dark:text-white">NEOTERIC GROUP</h2>
                <p className="text-[10px] font-medium underline">Gwalior, Madhya Pradesh.</p>
              </div>
              <div className="col-span-3 p-2 text-center flex flex-col justify-center bg-gray-50/30 dark:bg-gray-800/30">
                <p className="font-bold underline text-[11px] uppercase tracking-wider">Estimate Order</p>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-bold underline text-[12px] text-gray-900 dark:text-white">{selectedPO.project}</p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">{selectedPO.phase} • {selectedPO.milestone}</p>
                </div>
              </div>
            </div>

            {/* Info Grid Row 1 */}
            <div className="grid grid-cols-12 border-b border-gray-300 dark:border-gray-700">
              <div className="col-span-2 bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-700 font-bold flex items-center">Supplier</div>
              <div className="col-span-4 p-2 border-r border-gray-300 dark:border-gray-700 flex items-center font-bold text-gray-900 dark:text-white uppercase">{selectedPO.supplier}</div>
              <div className="col-span-2 bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-700 font-bold flex items-center">Location</div>
              <div className="col-span-2 p-2 border-r border-gray-300 dark:border-gray-700 flex items-center font-medium">{selectedPO.location || "N/A"}</div>
              <div className="col-span-1 bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-700 font-bold flex items-center justify-center text-center leading-tight text-[9px]">Order Date</div>
              <div className="col-span-1 p-2 flex items-center justify-center font-bold">{selectedPO.date}</div>
            </div>

            {/* Info Grid Row 2 */}
            <div className="grid grid-cols-12 border-b border-gray-300 dark:border-gray-700">
              <div className="col-span-2 bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-700 font-bold flex items-center">Order No.</div>
              <div className="col-span-3 p-2 border-r border-gray-300 dark:border-gray-700 flex items-center bg-emerald-50 dark:bg-emerald-900/20 font-bold text-emerald-700 dark:text-emerald-400">{selectedPO.id}</div>
              <div className="col-span-2 bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-700 font-bold flex items-center justify-center text-center leading-tight">Entered By</div>
              <div className="col-span-2 p-2 border-r border-gray-300 dark:border-gray-700 flex items-center justify-center font-medium">{selectedPO.createdBy}</div>
              <div className="col-span-1 bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-700 font-bold flex items-center justify-center text-center leading-tight">Priority</div>
              <div className={`col-span-2 p-2 flex items-center justify-center font-bold text-white ${selectedPO.priority === 'Urgent' ? 'bg-red-600' : selectedPO.priority === 'Low' ? 'bg-blue-500' : 'bg-green-600'}`}>
                {selectedPO.priority || "Normal"}
              </div>
            </div>

            {/* Info Grid Row 3 */}
            <div className="grid grid-cols-12 border-b border-gray-300 dark:border-gray-700">
              <div className="col-span-2 bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-700 font-bold flex items-center">Applicated Area</div>
              <div className="col-span-4 p-2 border-r border-gray-300 dark:border-gray-700 flex items-center font-medium italic text-gray-600 dark:text-gray-400">
                {selectedPO.applicatedArea || "N/A"}
              </div>
              <div className="col-span-2 bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-700 font-bold flex items-center">Requirement By</div>
              <div className="col-span-3 p-2 border-r border-gray-300 dark:border-gray-700 flex items-center font-bold text-gray-900 dark:text-white">{selectedPO.requirementBy || "N/A"}</div>
              <div className="col-span-1 flex flex-col">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 text-center border-b border-gray-300 dark:border-gray-700 font-bold text-[9px] uppercase">Total</div>
                <div className="p-1 text-center font-bold text-[13px]">{selectedPO.totalValue.toLocaleString()}</div>
              </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-none">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-tight">
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center w-8">Sr. No.</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left min-w-[150px]">Product Name</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center w-12">Image</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">SKU Code</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center w-12">Unit</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">Current Stock</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">Rate</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">Total</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">GST %</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">Total With GST</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">Requirement Qty</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-center bg-gray-200 dark:bg-gray-700">Order Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items.map((item, idx) => {
                    const invItem = inventory.find(i => i.sku === item.sku);
                    const currentStock = invItem ? invItem.liveStock : (item.currentStock ?? 0);

                    return (
                      <tr key={idx} className="text-[11px]">
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center font-medium">{idx + 1}</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 font-medium">{item.name}</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center"></td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center font-mono text-[10px]">{item.sku}</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center font-bold">{item.unit}</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center font-medium">{currentStock}</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">{item.rate || ""}</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">{item.total || ""}</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center">{item.gstPct}%</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center font-bold">{item.totalWithGST || ""}</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center font-medium">{item.requirementQty || 0}</td>
                        <td className="border border-gray-300 dark:border-gray-700 p-1.5 text-center font-bold bg-gray-50 dark:bg-gray-800">{item.qty} {item.unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedPO.justification && (
              <div className="p-3 border-t border-gray-300 dark:border-gray-700 bg-orange-50/30 dark:bg-orange-900/10">
                <p className="text-[10px] font-bold text-orange-800 dark:text-orange-400 uppercase mb-1">Justification:</p>
                <p className="italic text-gray-600 dark:text-gray-400">"{selectedPO.justification}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 no-print">
            <Btn label="Close" outline onClick={() => setViewModal(false)} />
            <Btn label="Download PDF" icon={FileText} onClick={() => downloadPDF(selectedPO)} />
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              .no-print { display: none !important; }
              body * { visibility: hidden; }
              #printable-po, #printable-po * { visibility: visible; }
              #printable-po { position: absolute; left: 0; top: 0; width: 100%; }
            }
          `}} />
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Purchase Order"
          message={`Are you sure you want to delete PO ${deleteConfirm}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

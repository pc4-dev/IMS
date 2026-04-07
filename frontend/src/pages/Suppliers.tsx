import React, { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../store";
import { toast } from "react-hot-toast";
import {
  PageHeader,
  Card,
  StatusBadge,
  Btn,
  Modal,
  Field,
  SField,
  Pagination,
  ConfirmModal,
  ImageUpload,
} from "../components/ui";
import { Plus, Upload, CheckCircle2, AlertCircle, Eye, Edit2, Trash2 } from "lucide-react";
import { Supplier } from "../types";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const MOBILE_REGEX = /^[0-9]{10}$/;

export const Suppliers = () => {
  const { 
    suppliers, 
    suppliersPagination,
    fetchResource,
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    role, 
    uploadImage,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    fetchResource('suppliers', 1);
  }, [fetchResource]);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [section, setSection] = useState(1);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const initialSupplier: Partial<Supplier> = {
    email: "",
    companyName: "",
    ownerName: "",
    mobile: "",
    altMobile: "",
    website: "",
    address: "",
    dealingProducts: "",
    references: "",
    avgTurnover: "Below 50L",
    additionalInfo: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    panNumber: "",
    gstNumber: "",
    gstCertificateUrl: "",
    panCardUrl: "",
    bankProofUrl: "",
    businessCardUrl: "",
    processCoordinator: "",
    status: "Active",
  };

  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>(initialSupplier);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canEdit = ["Super Admin", "Director", "AGM"].includes(role || "");

  const handlePageChange = useCallback((page: number) => {
    fetchResource('suppliers', page);
  }, [fetchResource]);

  const validateSection = (s: number) => {
    const newErrors: Record<string, string> = {};
    if (s === 1) {
      if (!newSupplier.email) newErrors.email = "Email is required";
      else if (!newSupplier.email.includes("@")) newErrors.email = "Invalid email format";
      
      if (!newSupplier.companyName) newErrors.companyName = "Company name is required";
      if (!newSupplier.ownerName) newErrors.ownerName = "Owner name is required";
      
      if (!newSupplier.mobile) newErrors.mobile = "Mobile is required";
      else if (!MOBILE_REGEX.test(newSupplier.mobile)) newErrors.mobile = "Invalid 10-digit mobile number";
    }
    if (s === 2) {
      if (!newSupplier.address) newErrors.address = "Address is required";
      if (!newSupplier.dealingProducts) newErrors.dealingProducts = "Dealing products are required";
    }
    if (s === 3) {
      if (!newSupplier.accountHolderName) newErrors.accountHolderName = "Account holder name is required";
      if (!newSupplier.bankName) newErrors.bankName = "Bank name is required";
      if (!newSupplier.accountNumber) newErrors.accountNumber = "Account number is required";
      if (!newSupplier.branch) newErrors.branch = "Branch is required";
      
      if (!newSupplier.ifscCode) newErrors.ifscCode = "IFSC code is required";
      else if (!IFSC_REGEX.test(newSupplier.ifscCode)) newErrors.ifscCode = "Invalid IFSC format (e.g. ABCD0123456)";
    }
    if (s === 4) {
      if (!newSupplier.panNumber) newErrors.panNumber = "PAN number is required";
      else if (!PAN_REGEX.test(newSupplier.panNumber)) newErrors.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";
      
      if (newSupplier.gstNumber && !GST_REGEX.test(newSupplier.gstNumber)) newErrors.gstNumber = "Invalid GST format";
    }
    if (s === 5) {
      if (!newSupplier.panCardUrl) newErrors.panCardUrl = "PAN card upload is required";
      if (!newSupplier.bankProofUrl) newErrors.bankProofUrl = "Bank proof upload is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleFileChange = async (field: keyof Supplier, file: File) => {
    setUploadingField(field as string);
    try {
      const { url } = await uploadImage(file);
      setNewSupplier(prev => ({ ...prev, [field]: url }));
    } catch (error: any) {
      toast.error(`Failed to upload file: ${error.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleCreate = async () => {
    setError("");
    
    // Check for duplicates in local state first (only for new suppliers)
    if (!isEditing) {
      const isDuplicateEmail = suppliers.some(v => v.email === newSupplier.email);
      const isDuplicateMobile = suppliers.some(v => v.mobile === newSupplier.mobile);
      
      if (isDuplicateEmail) {
        setError("A supplier with this email already exists.");
        return;
      }
      if (isDuplicateMobile) {
        setError("A supplier with this mobile number already exists.");
        return;
      }
    }

    const supplierData: Supplier = {
      ...newSupplier as Supplier,
      id: isEditing ? newSupplier.id! : `S${String(suppliers.length + 1).padStart(3, "0")}`,
      // Map legacy fields
      name: newSupplier.companyName!,
      contact: newSupplier.ownerName!,
      phone: newSupplier.mobile!,
      category: newSupplier.dealingProducts!,
      gst: newSupplier.gstNumber || "N/A",
      status: newSupplier.status as "Active" | "Inactive",
    };

    try {
      if (isEditing) {
        await updateSupplier(supplierData.id, supplierData);
      } else {
        await addSupplier(supplierData);
      }
      setModal(false);
      setNewSupplier(initialSupplier);
      setSection(1);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save supplier. Please check for duplicate entries.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await deleteSupplier(id);
      } catch (err: any) {
        alert(err.message || "Failed to delete supplier");
      }
    }
  };

  const sections = [
    "Basic Info",
    "Business Details",
    "Bank Details",
    "Legal Details",
    "Document Upload",
    "Internal Tracking"
  ];

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteSupplier(deletingId);
      setDeletingId(null);
    } catch (err: any) {
      console.error("Failed to delete supplier:", err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Database"
        sub="Manage suppliers and contractors"
        actions={
          canEdit && (
            <Btn
              label="Add Supplier"
              icon={Plus}
              onClick={() => {
                setNewSupplier(initialSupplier);
                setSection(1);
                setIsEditing(false);
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
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Owner</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Mobile</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Products</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-mono text-[#6B7280] dark:text-gray-400">{s.id}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">{s.companyName || s.name}</td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">{s.ownerName || s.contact}</td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">{s.mobile || s.phone}</td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">{s.dealingProducts || s.category}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Btn
                      icon={Eye}
                      small
                      outline
                      onClick={() => {
                        setSelectedSupplier(s);
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
                            setNewSupplier(s);
                            setSection(1);
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
                          onClick={() => setDeletingId(s.id)}
                          title="Delete"
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {suppliersPagination && (
        <Pagination
          data={suppliersPagination}
          onPageChange={handlePageChange}
        />
      )}

      {viewModal && selectedSupplier && (
        <Modal title={`Supplier Details - ${selectedSupplier.companyName || selectedSupplier.name}`} onClose={() => setViewModal(false)} wide>
          <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
            {/* Basic Info */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Email</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.email || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Company Name</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.companyName || selectedSupplier.name}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Owner Name</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.ownerName || selectedSupplier.contact}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Mobile</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.mobile || selectedSupplier.phone}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Alt Mobile</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.altMobile || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Website</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.website || "N/A"}</p></div>
              </div>
            </section>

            {/* Business Details */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Business Details</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="col-span-2"><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Address</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.address || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Dealing Products</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.dealingProducts || selectedSupplier.category}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Avg Turnover</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.avgTurnover || "N/A"}</p></div>
                <div className="col-span-2"><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">References</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.references || "N/A"}</p></div>
                <div className="col-span-2"><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Additional Info</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.additionalInfo || "N/A"}</p></div>
              </div>
            </section>

            {/* Bank Details */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Bank Details</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Account Holder</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.accountHolderName || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Bank Name</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.bankName || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Account Number</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.accountNumber || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">IFSC Code</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.ifscCode || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Branch</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.branch || "N/A"}</p></div>
              </div>
            </section>

            {/* Legal Details */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Legal Details</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">PAN Number</p><p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{selectedSupplier.panNumber || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">GST Number</p><p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{selectedSupplier.gstNumber || selectedSupplier.gst || "N/A"}</p></div>
              </div>
            </section>

            {/* Documents */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Uploaded Documents</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {selectedSupplier.panCardUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">PAN Card</p>
                    <img src={selectedSupplier.panCardUrl} className="w-full h-24 object-cover rounded border border-gray-100 dark:border-gray-800" referrerPolicy="no-referrer" />
                  </div>
                )}
                {selectedSupplier.bankProofUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Bank Proof</p>
                    <img src={selectedSupplier.bankProofUrl} className="w-full h-24 object-cover rounded border border-gray-100 dark:border-gray-800" referrerPolicy="no-referrer" />
                  </div>
                )}
                {selectedSupplier.gstCertificateUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">GST Cert</p>
                    <img src={selectedSupplier.gstCertificateUrl} className="w-full h-24 object-cover rounded border border-gray-100 dark:border-gray-800" referrerPolicy="no-referrer" />
                  </div>
                )}
                {selectedSupplier.businessCardUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Biz Card</p>
                    <img src={selectedSupplier.businessCardUrl} className="w-full h-24 object-cover rounded border border-gray-100 dark:border-gray-800" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </section>

            {/* Internal Tracking */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Internal Tracking</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Process Coordinator</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedSupplier.processCoordinator || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Status</p><StatusBadge status={selectedSupplier.status} /></div>
              </div>
            </section>
          </div>
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <Btn label="Close" outline onClick={() => setViewModal(false)} />
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={`${isEditing ? "Edit Supplier" : "Supplier Registration"} - ${sections[section - 1]}`} onClose={() => setModal(false)}>
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-8">
              {sections.map((_, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    section > i + 1 ? "bg-green-500 text-white" : 
                    section === i + 1 ? "bg-[#1A1A2E] dark:bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}>
                    {section > i + 1 ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  {i < sections.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 transition-colors ${section > i + 1 ? "bg-green-500" : "bg-gray-200 dark:bg-gray-800"}`} />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section === 1 && (
                <>
                  <Field label="Email" value={newSupplier.email} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))} required type="email" error={errors.email} />
                  <Field label="Company Name" value={newSupplier.companyName} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, companyName: e.target.value }))} required error={errors.companyName} />
                  <Field label="Owner Name" value={newSupplier.ownerName} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, ownerName: e.target.value }))} required error={errors.ownerName} />
                  <Field label="Mobile (10-digit)" value={newSupplier.mobile} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, mobile: e.target.value }))} required maxLength={10} error={errors.mobile} />
                  <Field label="Alt Mobile" value={newSupplier.altMobile} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, altMobile: e.target.value }))} maxLength={10} error={errors.altMobile} />
                  <Field label="Website" value={newSupplier.website} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, website: e.target.value }))} error={errors.website} />
                </>
              )}

              {section === 2 && (
                <>
                  <div className="sm:col-span-2">
                    <Field label="Address" value={newSupplier.address} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))} required error={errors.address} />
                  </div>
                  <Field label="Dealing Products/Services" value={newSupplier.dealingProducts} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, dealingProducts: e.target.value }))} required error={errors.dealingProducts} />
                  <Field label="References" value={newSupplier.references} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, references: e.target.value }))} error={errors.references} />
                  <SField
                    label="Avg Turnover"
                    value={newSupplier.avgTurnover}
                    onChange={(e: any) => setNewSupplier(prev => ({ ...prev, avgTurnover: e.target.value }))}
                    options={["Below 50L", "50L - 1Cr", "1Cr - 5Cr", "Above 5Cr"]}
                    error={errors.avgTurnover}
                  />
                  <div className="sm:col-span-2">
                    <Field label="Additional Info" value={newSupplier.additionalInfo} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, additionalInfo: e.target.value }))} error={errors.additionalInfo} />
                  </div>
                </>
              )}

              {section === 3 && (
                <>
                  <Field label="Account Holder Name" value={newSupplier.accountHolderName} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, accountHolderName: e.target.value }))} required error={errors.accountHolderName} />
                  <Field label="Bank Name" value={newSupplier.bankName} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, bankName: e.target.value }))} required error={errors.bankName} />
                  <Field label="Account Number" value={newSupplier.accountNumber} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, accountNumber: e.target.value }))} required error={errors.accountNumber} />
                  <Field label="IFSC Code" value={newSupplier.ifscCode} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))} required placeholder="ABCD0123456" error={errors.ifscCode} />
                  <Field label="Branch" value={newSupplier.branch} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, branch: e.target.value }))} required error={errors.branch} />
                </>
              )}

              {section === 4 && (
                <>
                  <Field label="PAN Number" value={newSupplier.panNumber} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))} required maxLength={10} placeholder="ABCDE1234F" error={errors.panNumber} />
                  <Field label="GST Number" value={newSupplier.gstNumber} onChange={(e: any) => setNewSupplier(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))} maxLength={15} error={errors.gstNumber} />
                </>
              )}

              {section === 5 && (
                <>
                  <ImageUpload
                    label="PAN Card"
                    id="pan-upload"
                    value={newSupplier.panCardUrl}
                    onChange={(file) => handleFileChange("panCardUrl", file)}
                    error={errors.panCardUrl}
                    required
                    loading={uploadingField === "panCardUrl"}
                  />
                  <ImageUpload
                    label="Bank Proof"
                    id="bank-upload"
                    value={newSupplier.bankProofUrl}
                    onChange={(file) => handleFileChange("bankProofUrl", file)}
                    error={errors.bankProofUrl}
                    required
                    loading={uploadingField === "bankProofUrl"}
                  />
                  <ImageUpload
                    label="GST Certificate"
                    id="gst-upload"
                    value={newSupplier.gstCertificateUrl}
                    onChange={(file) => handleFileChange("gstCertificateUrl", file)}
                    loading={uploadingField === "gstCertificateUrl"}
                  />
                  <ImageUpload
                    label="Business Card"
                    id="biz-upload"
                    value={newSupplier.businessCardUrl}
                    onChange={(file) => handleFileChange("businessCardUrl", file)}
                    loading={uploadingField === "businessCardUrl"}
                  />
                </>
              )}

              {section === 6 && (
                <>
                  <Field label="Process Coordinator" value={newSupplier.processCoordinator} onChange={(e: any) => setNewSupplier({ ...newSupplier, processCoordinator: e.target.value })} error={errors.processCoordinator} />
                  <SField
                    label="Status"
                    value={newSupplier.status}
                    onChange={(e: any) => setNewSupplier({ ...newSupplier, status: e.target.value })}
                    options={["Active", "Inactive"]}
                    required
                    error={errors.status}
                  />
                </>
              )}
            </div>

            <div className="flex justify-between gap-2 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Btn label="Cancel" outline onClick={() => setModal(false)} />
              <div className="flex gap-2">
                {section > 1 && (
                  <Btn label="Previous" outline onClick={() => setSection(section - 1)} />
                )}
                {section < 6 ? (
                  <Btn 
                    label="Next" 
                    onClick={() => {
                      if (validateSection(section)) {
                        setSection(section + 1);
                      }
                    }} 
                  />
                ) : (
                  <Btn
                    label={isEditing ? "Update Supplier" : "Complete Registration"}
                    onClick={handleCreate}
                  />
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deletingId && (
        <ConfirmModal
          title="Delete Supplier"
          message="Are you sure you want to delete this supplier? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

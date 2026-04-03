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
import { Vendor } from "../types";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const MOBILE_REGEX = /^[0-9]{10}$/;

export const Vendors = () => {
  const { 
    vendors, 
    vendorsPagination,
    fetchResource,
    addVendor, 
    updateVendor, 
    deleteVendor, 
    role, 
    uploadImage,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    fetchResource('vendors', 1);
  }, [fetchResource]);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [section, setSection] = useState(1);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const initialVendor: Partial<Vendor> = {
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

  const [newVendor, setNewVendor] = useState<Partial<Vendor>>(initialVendor);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canEdit = ["Super Admin", "Director", "AGM"].includes(role || "");

  const handlePageChange = useCallback((page: number) => {
    fetchResource('vendors', page);
  }, [fetchResource]);

  const validateSection = (s: number) => {
    const newErrors: Record<string, string> = {};
    if (s === 1) {
      if (!newVendor.email) newErrors.email = "Email is required";
      else if (!newVendor.email.includes("@")) newErrors.email = "Invalid email format";
      
      if (!newVendor.companyName) newErrors.companyName = "Company name is required";
      if (!newVendor.ownerName) newErrors.ownerName = "Owner name is required";
      
      if (!newVendor.mobile) newErrors.mobile = "Mobile is required";
      else if (!MOBILE_REGEX.test(newVendor.mobile)) newErrors.mobile = "Invalid 10-digit mobile number";
    }
    if (s === 2) {
      if (!newVendor.address) newErrors.address = "Address is required";
      if (!newVendor.dealingProducts) newErrors.dealingProducts = "Dealing products are required";
    }
    if (s === 3) {
      if (!newVendor.accountHolderName) newErrors.accountHolderName = "Account holder name is required";
      if (!newVendor.bankName) newErrors.bankName = "Bank name is required";
      if (!newVendor.accountNumber) newErrors.accountNumber = "Account number is required";
      if (!newVendor.branch) newErrors.branch = "Branch is required";
      
      if (!newVendor.ifscCode) newErrors.ifscCode = "IFSC code is required";
      else if (!IFSC_REGEX.test(newVendor.ifscCode)) newErrors.ifscCode = "Invalid IFSC format (e.g. ABCD0123456)";
    }
    if (s === 4) {
      if (!newVendor.panNumber) newErrors.panNumber = "PAN number is required";
      else if (!PAN_REGEX.test(newVendor.panNumber)) newErrors.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";
      
      if (newVendor.gstNumber && !GST_REGEX.test(newVendor.gstNumber)) newErrors.gstNumber = "Invalid GST format";
    }
    if (s === 5) {
      if (!newVendor.panCardUrl) newErrors.panCardUrl = "PAN card upload is required";
      if (!newVendor.bankProofUrl) newErrors.bankProofUrl = "Bank proof upload is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleFileChange = async (field: keyof Vendor, file: File) => {
    setUploadingField(field as string);
    try {
      const { url } = await uploadImage(file);
      setNewVendor(prev => ({ ...prev, [field]: url }));
    } catch (error: any) {
      toast.error(`Failed to upload file: ${error.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleCreate = async () => {
    setError("");
    
    // Check for duplicates in local state first (only for new vendors)
    if (!isEditing) {
      const isDuplicateEmail = vendors.some(v => v.email === newVendor.email);
      const isDuplicateMobile = vendors.some(v => v.mobile === newVendor.mobile);
      
      if (isDuplicateEmail) {
        setError("A vendor with this email already exists.");
        return;
      }
      if (isDuplicateMobile) {
        setError("A vendor with this mobile number already exists.");
        return;
      }
    }

    const vendorData: Vendor = {
      ...newVendor as Vendor,
      id: isEditing ? newVendor.id! : `V${String(vendors.length + 1).padStart(3, "0")}`,
      // Map legacy fields
      name: newVendor.companyName!,
      contact: newVendor.ownerName!,
      phone: newVendor.mobile!,
      category: newVendor.dealingProducts!,
      gst: newVendor.gstNumber || "N/A",
      status: newVendor.status as "Active" | "Inactive",
    };

    try {
      if (isEditing) {
        await updateVendor(vendorData.id, vendorData);
      } else {
        await addVendor(vendorData);
      }
      setModal(false);
      setNewVendor(initialVendor);
      setSection(1);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save vendor. Please check for duplicate entries.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await deleteVendor(id);
      } catch (err: any) {
        alert(err.message || "Failed to delete vendor");
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
      await deleteVendor(deletingId);
      setDeletingId(null);
    } catch (err: any) {
      console.error("Failed to delete vendor:", err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Database"
        sub="Manage suppliers and contractors"
        actions={
          canEdit && (
            <Btn
              label="Add Vendor"
              icon={Plus}
              onClick={() => {
                setNewVendor(initialVendor);
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
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-mono text-[#6B7280] dark:text-gray-400">{v.id}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">{v.companyName || v.name}</td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">{v.ownerName || v.contact}</td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">{v.mobile || v.phone}</td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">{v.dealingProducts || v.category}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Btn
                      icon={Eye}
                      small
                      outline
                      onClick={() => {
                        setSelectedVendor(v);
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
                            setNewVendor(v);
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
                          onClick={() => setDeletingId(v.id)}
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

      {vendorsPagination && (
        <Pagination
          data={vendorsPagination}
          onPageChange={handlePageChange}
        />
      )}

      {viewModal && selectedVendor && (
        <Modal title={`Vendor Details - ${selectedVendor.companyName || selectedVendor.name}`} onClose={() => setViewModal(false)} wide>
          <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
            {/* Basic Info */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Email</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.email || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Company Name</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.companyName || selectedVendor.name}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Owner Name</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.ownerName || selectedVendor.contact}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Mobile</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.mobile || selectedVendor.phone}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Alt Mobile</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.altMobile || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Website</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.website || "N/A"}</p></div>
              </div>
            </section>

            {/* Business Details */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Business Details</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="col-span-2"><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Address</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.address || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Dealing Products</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.dealingProducts || selectedVendor.category}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Avg Turnover</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.avgTurnover || "N/A"}</p></div>
                <div className="col-span-2"><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">References</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.references || "N/A"}</p></div>
                <div className="col-span-2"><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Additional Info</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.additionalInfo || "N/A"}</p></div>
              </div>
            </section>

            {/* Bank Details */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Bank Details</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Account Holder</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.accountHolderName || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Bank Name</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.bankName || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Account Number</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.accountNumber || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">IFSC Code</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.ifscCode || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Branch</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.branch || "N/A"}</p></div>
              </div>
            </section>

            {/* Legal Details */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Legal Details</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">PAN Number</p><p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{selectedVendor.panNumber || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">GST Number</p><p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{selectedVendor.gstNumber || selectedVendor.gst || "N/A"}</p></div>
              </div>
            </section>

            {/* Documents */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Uploaded Documents</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {selectedVendor.panCardUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">PAN Card</p>
                    <img src={selectedVendor.panCardUrl} className="w-full h-24 object-cover rounded border border-gray-100 dark:border-gray-800" referrerPolicy="no-referrer" />
                  </div>
                )}
                {selectedVendor.bankProofUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Bank Proof</p>
                    <img src={selectedVendor.bankProofUrl} className="w-full h-24 object-cover rounded border border-gray-100 dark:border-gray-800" referrerPolicy="no-referrer" />
                  </div>
                )}
                {selectedVendor.gstCertificateUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">GST Cert</p>
                    <img src={selectedVendor.gstCertificateUrl} className="w-full h-24 object-cover rounded border border-gray-100 dark:border-gray-800" referrerPolicy="no-referrer" />
                  </div>
                )}
                {selectedVendor.businessCardUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Biz Card</p>
                    <img src={selectedVendor.businessCardUrl} className="w-full h-24 object-cover rounded border border-gray-100 dark:border-gray-800" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </section>

            {/* Internal Tracking */}
            <section>
              <h3 className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Internal Tracking</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Process Coordinator</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedVendor.processCoordinator || "N/A"}</p></div>
                <div><p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Status</p><StatusBadge status={selectedVendor.status} /></div>
              </div>
            </section>
          </div>
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <Btn label="Close" outline onClick={() => setViewModal(false)} />
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={`${isEditing ? "Edit Vendor" : "Vendor Registration"} - ${sections[section - 1]}`} onClose={() => setModal(false)}>
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
                  <Field label="Email" value={newVendor.email} onChange={(e: any) => setNewVendor(prev => ({ ...prev, email: e.target.value }))} required type="email" error={errors.email} />
                  <Field label="Company Name" value={newVendor.companyName} onChange={(e: any) => setNewVendor(prev => ({ ...prev, companyName: e.target.value }))} required error={errors.companyName} />
                  <Field label="Owner Name" value={newVendor.ownerName} onChange={(e: any) => setNewVendor(prev => ({ ...prev, ownerName: e.target.value }))} required error={errors.ownerName} />
                  <Field label="Mobile (10-digit)" value={newVendor.mobile} onChange={(e: any) => setNewVendor(prev => ({ ...prev, mobile: e.target.value }))} required maxLength={10} error={errors.mobile} />
                  <Field label="Alt Mobile" value={newVendor.altMobile} onChange={(e: any) => setNewVendor(prev => ({ ...prev, altMobile: e.target.value }))} maxLength={10} error={errors.altMobile} />
                  <Field label="Website" value={newVendor.website} onChange={(e: any) => setNewVendor(prev => ({ ...prev, website: e.target.value }))} error={errors.website} />
                </>
              )}

              {section === 2 && (
                <>
                  <div className="sm:col-span-2">
                    <Field label="Address" value={newVendor.address} onChange={(e: any) => setNewVendor(prev => ({ ...prev, address: e.target.value }))} required error={errors.address} />
                  </div>
                  <Field label="Dealing Products/Services" value={newVendor.dealingProducts} onChange={(e: any) => setNewVendor(prev => ({ ...prev, dealingProducts: e.target.value }))} required error={errors.dealingProducts} />
                  <Field label="References" value={newVendor.references} onChange={(e: any) => setNewVendor(prev => ({ ...prev, references: e.target.value }))} error={errors.references} />
                  <SField
                    label="Avg Turnover"
                    value={newVendor.avgTurnover}
                    onChange={(e: any) => setNewVendor(prev => ({ ...prev, avgTurnover: e.target.value }))}
                    options={["Below 50L", "50L - 1Cr", "1Cr - 5Cr", "Above 5Cr"]}
                    error={errors.avgTurnover}
                  />
                  <div className="sm:col-span-2">
                    <Field label="Additional Info" value={newVendor.additionalInfo} onChange={(e: any) => setNewVendor(prev => ({ ...prev, additionalInfo: e.target.value }))} error={errors.additionalInfo} />
                  </div>
                </>
              )}

              {section === 3 && (
                <>
                  <Field label="Account Holder Name" value={newVendor.accountHolderName} onChange={(e: any) => setNewVendor(prev => ({ ...prev, accountHolderName: e.target.value }))} required error={errors.accountHolderName} />
                  <Field label="Bank Name" value={newVendor.bankName} onChange={(e: any) => setNewVendor(prev => ({ ...prev, bankName: e.target.value }))} required error={errors.bankName} />
                  <Field label="Account Number" value={newVendor.accountNumber} onChange={(e: any) => setNewVendor(prev => ({ ...prev, accountNumber: e.target.value }))} required error={errors.accountNumber} />
                  <Field label="IFSC Code" value={newVendor.ifscCode} onChange={(e: any) => setNewVendor(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))} required placeholder="ABCD0123456" error={errors.ifscCode} />
                  <Field label="Branch" value={newVendor.branch} onChange={(e: any) => setNewVendor(prev => ({ ...prev, branch: e.target.value }))} required error={errors.branch} />
                </>
              )}

              {section === 4 && (
                <>
                  <Field label="PAN Number" value={newVendor.panNumber} onChange={(e: any) => setNewVendor(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))} required maxLength={10} placeholder="ABCDE1234F" error={errors.panNumber} />
                  <Field label="GST Number" value={newVendor.gstNumber} onChange={(e: any) => setNewVendor(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))} maxLength={15} error={errors.gstNumber} />
                </>
              )}

              {section === 5 && (
                <>
                  <ImageUpload
                    label="PAN Card"
                    id="pan-upload"
                    value={newVendor.panCardUrl}
                    onChange={(file) => handleFileChange("panCardUrl", file)}
                    error={errors.panCardUrl}
                    required
                    loading={uploadingField === "panCardUrl"}
                  />
                  <ImageUpload
                    label="Bank Proof"
                    id="bank-upload"
                    value={newVendor.bankProofUrl}
                    onChange={(file) => handleFileChange("bankProofUrl", file)}
                    error={errors.bankProofUrl}
                    required
                    loading={uploadingField === "bankProofUrl"}
                  />
                  <ImageUpload
                    label="GST Certificate"
                    id="gst-upload"
                    value={newVendor.gstCertificateUrl}
                    onChange={(file) => handleFileChange("gstCertificateUrl", file)}
                    loading={uploadingField === "gstCertificateUrl"}
                  />
                  <ImageUpload
                    label="Business Card"
                    id="biz-upload"
                    value={newVendor.businessCardUrl}
                    onChange={(file) => handleFileChange("businessCardUrl", file)}
                    loading={uploadingField === "businessCardUrl"}
                  />
                </>
              )}

              {section === 6 && (
                <>
                  <Field label="Process Coordinator" value={newVendor.processCoordinator} onChange={(e: any) => setNewVendor({ ...newVendor, processCoordinator: e.target.value })} error={errors.processCoordinator} />
                  <SField
                    label="Status"
                    value={newVendor.status}
                    onChange={(e: any) => setNewVendor({ ...newVendor, status: e.target.value })}
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
                    label={isEditing ? "Update Vendor" : "Complete Registration"}
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
          title="Delete Vendor"
          message="Are you sure you want to delete this vendor? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

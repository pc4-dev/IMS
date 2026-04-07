import React, { useState } from "react";
import { useAppStore } from "../store";
import { Card, Btn, Field, ImageUpload } from "../components/ui";
import { CheckCircle, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { Supplier } from "../types";
import { toast } from "react-hot-toast";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const MOBILE_REGEX = /^[0-9]{10}$/;

const INITIAL_SUPPLIER: Partial<Supplier> = {
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
};

export const PublicSuppliers = () => {
  const { submitPublicSupplier, uploadPublicImage, actionLoading } = useAppStore();
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>(INITIAL_SUPPLIER);
  const [section, setSection] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
      else if (!IFSC_REGEX.test(newSupplier.ifscCode)) newErrors.ifscCode = "Invalid IFSC format";
    }
    if (s === 4) {
      if (!newSupplier.panNumber) newErrors.panNumber = "PAN number is required";
      else if (!PAN_REGEX.test(newSupplier.panNumber)) newErrors.panNumber = "Invalid PAN format";
      
      if (newSupplier.gstNumber && !GST_REGEX.test(newSupplier.gstNumber)) newErrors.gstNumber = "Invalid GST format";
    }
    if (s === 5) {
      if (!newSupplier.panCardUrl) newErrors.panCardUrl = "PAN card upload is required";
      if (!newSupplier.bankProofUrl) newErrors.bankProofUrl = "Bank proof upload is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = async (field: keyof Supplier, file: File) => {
    setUploadingField(field as string);
    try {
      const { url } = await uploadPublicImage(file);
      setNewSupplier(prev => ({ ...prev, [field]: url }));
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(`Failed to upload file: ${error.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateSection(5)) return;

    try {
      // Map legacy fields for compatibility
      const supplierData = {
        ...newSupplier,
        name: newSupplier.companyName,
        contact: newSupplier.ownerName,
        phone: newSupplier.mobile,
        category: newSupplier.dealingProducts,
        gst: newSupplier.gstNumber || "N/A",
      };

      await submitPublicSupplier(supplierData);
      setSubmitted(true);
      toast.success("Registration submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit registration");
    }
  };

  const sections = [
    "Basic Info",
    "Business Details",
    "Bank Details",
    "Legal Details",
    "Document Upload"
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Registration Successful!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your supplier registration has been submitted and is being processed.
          </p>
          <Btn 
            label="Register Another" 
            className="w-full"
            onClick={() => {
              setSubmitted(false);
              setNewSupplier(INITIAL_SUPPLIER);
              setSection(1);
              setErrors({});
            }} 
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Supplier Registration Form</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Join our network of suppliers and contractors</p>
        </div>

        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px] px-2">
            {sections.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-2 relative flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors z-10 ${
                  section === i + 1 ? "bg-[#F97316] text-white" : 
                  section > i + 1 ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                }`}>
                  {section > i + 1 ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${section === i + 1 ? "text-[#F97316]" : "text-gray-400"}`}>
                  {s}
                </span>
                {i < sections.length - 1 && (
                  <div className={`absolute left-[50%] top-4 w-full h-[2px] -z-0 ${section > i + 1 ? "bg-green-500" : "bg-gray-200 dark:bg-gray-800"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="space-y-6">
            {section === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Email Address *" type="email" value={newSupplier.email} onChange={(e: any) => setNewSupplier({...newSupplier, email: e.target.value})} error={errors.email} />
                <Field label="Company Name *" value={newSupplier.companyName} onChange={(e: any) => setNewSupplier({...newSupplier, companyName: e.target.value})} error={errors.companyName} />
                <Field label="Owner Name *" value={newSupplier.ownerName} onChange={(e: any) => setNewSupplier({...newSupplier, ownerName: e.target.value})} error={errors.ownerName} />
                <Field label="Mobile Number *" value={newSupplier.mobile} onChange={(e: any) => setNewSupplier({...newSupplier, mobile: e.target.value})} error={errors.mobile} />
                <Field label="Alternate Mobile" value={newSupplier.altMobile} onChange={(e: any) => setNewSupplier({...newSupplier, altMobile: e.target.value})} />
                <Field label="Website" value={newSupplier.website} onChange={(e: any) => setNewSupplier({...newSupplier, website: e.target.value})} />
              </div>
            )}

            {section === 2 && (
              <div className="grid grid-cols-1 gap-4">
                <Field label="Full Address *" value={newSupplier.address} onChange={(e: any) => setNewSupplier({...newSupplier, address: e.target.value})} error={errors.address} />
                <Field label="Dealing Products/Services *" value={newSupplier.dealingProducts} onChange={(e: any) => setNewSupplier({...newSupplier, dealingProducts: e.target.value})} error={errors.dealingProducts} />
                <Field label="References" value={newSupplier.references} onChange={(e: any) => setNewSupplier({...newSupplier, references: e.target.value})} />
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Average Turnover</label>
                  <select 
                    value={newSupplier.avgTurnover} 
                    onChange={(e) => setNewSupplier({...newSupplier, avgTurnover: e.target.value})}
                    className="w-full px-4 py-2 border border-[#E8ECF0] dark:border-gray-700 rounded-lg text-[13px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#F97316]"
                  >
                    <option>Below 50L</option>
                    <option>50L - 1Cr</option>
                    <option>1Cr - 5Cr</option>
                    <option>Above 5Cr</option>
                  </select>
                </div>
                <Field label="Additional Info" value={newSupplier.additionalInfo} onChange={(e: any) => setNewSupplier({...newSupplier, additionalInfo: e.target.value})} />
              </div>
            )}

            {section === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Account Holder Name *" value={newSupplier.accountHolderName} onChange={(e: any) => setNewSupplier({...newSupplier, accountHolderName: e.target.value})} error={errors.accountHolderName} />
                <Field label="Bank Name *" value={newSupplier.bankName} onChange={(e: any) => setNewSupplier({...newSupplier, bankName: e.target.value})} error={errors.bankName} />
                <Field label="Account Number *" value={newSupplier.accountNumber} onChange={(e: any) => setNewSupplier({...newSupplier, accountNumber: e.target.value})} error={errors.accountNumber} />
                <Field label="IFSC Code *" value={newSupplier.ifscCode} onChange={(e: any) => setNewSupplier({...newSupplier, ifscCode: e.target.value})} error={errors.ifscCode} />
                <Field label="Branch *" value={newSupplier.branch} onChange={(e: any) => setNewSupplier({...newSupplier, branch: e.target.value})} error={errors.branch} />
              </div>
            )}

            {section === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="PAN Number *" value={newSupplier.panNumber} onChange={(e: any) => setNewSupplier({...newSupplier, panNumber: e.target.value})} error={errors.panNumber} />
                <Field label="GST Number" value={newSupplier.gstNumber} onChange={(e: any) => setNewSupplier({...newSupplier, gstNumber: e.target.value})} error={errors.gstNumber} />
              </div>
            )}

            {section === 5 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUpload 
                  id="panCardUrl"
                  label="PAN Card Copy *" 
                  value={newSupplier.panCardUrl} 
                  onChange={(file) => handleFileChange('panCardUrl', file)} 
                  loading={uploadingField === 'panCardUrl'} 
                  error={errors.panCardUrl}
                />
                <ImageUpload 
                  id="bankProofUrl"
                  label="Bank Proof (Cheque/Passbook) *" 
                  value={newSupplier.bankProofUrl} 
                  onChange={(file) => handleFileChange('bankProofUrl', file)} 
                  loading={uploadingField === 'bankProofUrl'} 
                  error={errors.bankProofUrl}
                />
                <ImageUpload 
                  id="gstCertificateUrl"
                  label="GST Certificate" 
                  value={newSupplier.gstCertificateUrl} 
                  onChange={(file) => handleFileChange('gstCertificateUrl', file)} 
                  loading={uploadingField === 'gstCertificateUrl'} 
                />
                <ImageUpload 
                  id="businessCardUrl"
                  label="Business Card" 
                  value={newSupplier.businessCardUrl} 
                  onChange={(file) => handleFileChange('businessCardUrl', file)} 
                  loading={uploadingField === 'businessCardUrl'} 
                />
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <Btn 
                label="Back" 
                icon={ArrowLeft} 
                outline 
                disabled={section === 1 || actionLoading} 
                onClick={() => setSection(s => s - 1)} 
              />
              {section < 5 ? (
                <Btn 
                  label="Next" 
                  icon={ArrowRight} 
                  onClick={() => {
                    if (validateSection(section)) setSection(s => s + 1);
                  }} 
                />
              ) : (
                <Btn 
                  label="Submit Registration" 
                  icon={Save} 
                  loading={actionLoading} 
                  onClick={handleSubmit} 
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

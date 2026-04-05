export type Role =
  | "Super Admin"
  | "Director"
  | "AGM"
  | "Project Manager"
  | "Store Incharge"
  | "Accountant";

export interface InventoryItem {
  sku: string;
  itemName: string;
  category: string;
  subCategory: string;
  unit: string;
  openingStock: number;
  liveStock: number;
  condition: "New" | "Good" | "Needs Repair" | "Damaged";
  sourceSite?: string;
  lastProject?: string;
}

export interface CatalogueEntry {
  sku: string;
  name: string;
  brand: string;
  description: string;
  category: string;
  uom: string;
  location: string;
  minStock: number;
  imageUrl: string;
  status: "Draft" | "Approved";
}

export interface Vendor {
  id: string;
  // Basic Info
  email: string;
  companyName: string;
  ownerName: string;
  mobile: string;
  altMobile?: string;
  website?: string;
  
  // Business Details
  address: string;
  dealingProducts: string;
  references?: string;
  avgTurnover: string;
  additionalInfo?: string;
  
  // Bank Details
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  
  // Legal Details
  panNumber: string;
  gstNumber?: string;
  
  // Uploads (URLs)
  gstCertificateUrl?: string;
  panCardUrl: string;
  bankProofUrl: string;
  businessCardUrl?: string;
  
  // Internal Tracking
  processCoordinator?: string;
  
  // Status
  status: "Active" | "Inactive";
  
  // Legacy fields (kept for compatibility or mapped)
  name: string; // Map to companyName
  contact: string; // Map to ownerName
  phone: string; // Map to mobile
  category: string; // Map to dealingProducts
  gst: string; // Map to gstNumber
}

export interface POLineItem {
  sku: string;
  name: string;
  qty: number;
  unit: string;
  rate: number;
  gstPct: number;
  total: number;
  totalWithGST: number;
  currentStock?: number;
  category?: string;
  requirementQty?: number;
}

export interface PurchaseOrder {
  id: string;
  project: string;
  phase: string;
  workType: string;
  milestone: string;
  vendor: string;
  items: POLineItem[];
  totalValue: number;
  status: "Approved" | "Pending L1" | "Pending L2" | "Pending Account" | "Fulfilled" | "Blocked" | "Draft";
  approvalL1: "N/A" | "Pending" | "Approved";
  approvalL2: "N/A" | "Pending" | "Approved";
  justification?: string;
  createdBy: string;
  date: string;
  priority?: "Urgent" | "Normal" | "Low";
  applicatedArea?: string;
  requirementBy?: string;
  location?: string;
}

export interface PlanLineItem {
  sku: string;
  name: string;
  required: number;
  unit: string;
  available: number;
  reusable: number;
  shortage: number;
  priority: "High" | "Medium" | "Low";
  delivery: string;
  activity: string;
}

export interface MaterialPlan {
  id: string;
  project: string;
  milestone: string;
  workType: string;
  date: string;
  status: "Open" | "PO Raised" | "Fulfilled";
  items: PlanLineItem[];
}

export interface GRNItem {
  sku: string;
  name: string;
  ordered: number;
  received: number;
  variance: number;
}

export interface GRN {
  id: string;
  poId: string;
  project: string;
  vendor: string;
  date: string;
  challan: string;
  mrNo: string;
  docType:
    | "Challan"
    | "Invoice"
    | "Bilty"
    | "Gate Pass"
    | "Without Challan"
    | "Without Gate Pass";
  items: GRNItem[];
  status: "Draft" | "Confirmed";
  materialImageUrl?: string;
  challanImageUrl?: string;
}

export interface Inward {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  date: string;
  challanNo: string;
  mrNo: string;
  supplier: string;
  type: "GRN" | "Manual";
  grnRef?: string;
  project?: string;
  category?: string;
  materialPhotoUrl?: string;
  personPhotoUrl?: string;
}

export interface Outward {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  date: string;
  location: string;
  handoverTo: string;
  project?: string;
  category?: string;
  materialPhotoUrl?: string;
  handoverPhotoUrl?: string;
}

export interface MaterialTransferOutward {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  date: string;
  fromLocation: string;
  toLocation: string;
  handoverTo: string;
  project?: string;
  category?: string;
  materialPhotoUrl?: string;
  handoverPhotoUrl?: string;
  remarks?: string;
  module?: string;
}

export interface MaterialTransferInward {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  date: string;
  location: string;
  receivedBy: string;
  project?: string;
  category?: string;
  materialPhotoUrl?: string;
  personPhotoUrl?: string;
  remarks?: string;
  module?: string;
}

export interface InwardReturn {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  date: string;
  condition: "New" | "Good" | "Needs Repair" | "Damaged";
  vendor: string;
  remarks?: string;
  handoverTo?: string;
  materialPhotoUrl?: string;
}

export interface OutwardReturn {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  date: string;
  condition: "New" | "Good" | "Needs Repair" | "Damaged";
  sourceSite: string;
  remarks?: string;
  handoverFrom?: string;
  materialPhotoUrl?: string;
}

export interface WriteOff {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  reason: string;
  requestedBy: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface StockCheckItem {
  sku: string;
  name: string;
  systemStock: number;
  physicalStock: number;
  variance: number;
  unit: string;
}

export interface StockCheckReport {
  id: string;
  date: string;
  category: string;
  performedBy: string;
  items: StockCheckItem[];
  status: "Completed";
}

export interface Notification {
  id: string;
  message: string;
  severity: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
  path?: string;
  senderId?: string;
}

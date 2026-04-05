import mongoose, { Schema, Document } from 'mongoose';

// Inventory Model
const InventorySchema = new Schema({
  sku: { type: String, required: true, unique: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  unit: { type: String, required: true },
  openingStock: { type: Number, default: 0 },
  liveStock: { type: Number, default: 0 },
  condition: { type: String, enum: ["New", "Good", "Needs Repair", "Damaged"], default: "New" },
  sourceSite: String,
  lastProject: String,
}, { timestamps: true });

InventorySchema.index({ sku: 1 });
InventorySchema.index({ itemName: 1 });
InventorySchema.index({ category: 1 });
InventorySchema.index({ updatedAt: -1 });

export const Inventory = mongoose.model('Inventory', InventorySchema);

// Catalogue Model
const CatalogueSchema = new Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  uom: { type: String, required: true },
  location: { type: String, required: true },
  minStock: { type: Number, default: 0 },
  imageUrl: String,
  status: { type: String, enum: ["Draft", "Approved"], default: "Draft" },
}, { timestamps: true });

CatalogueSchema.index({ sku: 1 });
CatalogueSchema.index({ name: 1 });
CatalogueSchema.index({ category: 1 });
CatalogueSchema.index({ updatedAt: -1 });

export const Catalogue = mongoose.model('Catalogue', CatalogueSchema);

// Vendor Model
const VendorSchema = new Schema({
  id: { type: String, required: true, unique: true },
  
  // Basic Info
  email: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  ownerName: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  altMobile: String,
  website: String,
  
  // Business Details
  address: { type: String, required: true },
  dealingProducts: { type: String, required: true },
  references: String,
  avgTurnover: String,
  additionalInfo: String,
  
  // Bank Details
  accountHolderName: { type: String, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  branch: { type: String, required: true },
  
  // Legal Details
  panNumber: { type: String, required: true },
  gstNumber: String,
  
  // Uploads (URLs)
  gstCertificateUrl: String,
  panCardUrl: { type: String, required: true },
  bankProofUrl: { type: String, required: true },
  businessCardUrl: String,
  
  // Internal Tracking
  processCoordinator: String,
  
  // Status
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  
  // Legacy fields (kept for compatibility or mapped)
  name: { type: String, required: true }, // Map to companyName
  contact: { type: String, required: true }, // Map to ownerName
  phone: { type: String, required: true }, // Map to mobile
  category: { type: String, required: true }, // Map to dealingProducts
  gst: { type: String }, // Map to gstNumber
}, { timestamps: true });

VendorSchema.index({ id: 1 });
VendorSchema.index({ companyName: 1 });
VendorSchema.index({ email: 1 });
VendorSchema.index({ updatedAt: -1 });

export const Vendor = mongoose.model('Vendor', VendorSchema);

// Purchase Order Model
const POLineItemSchema = new Schema({
  sku: String,
  name: String,
  qty: Number,
  unit: String,
  rate: Number,
  gstPct: Number,
  total: Number,
  totalWithGST: Number,
  currentStock: Number,
  category: String,
  requirementQty: Number,
});

const POSchema = new Schema({
  id: { type: String, required: true, unique: true },
  project: String,
  phase: String,
  workType: String,
  milestone: String,
  vendor: String,
  items: [POLineItemSchema],
  totalValue: Number,
  status: { type: String, enum: ["Approved", "Pending", "Pending L1", "Pending L2", "Pending Account", "Fulfilled", "Blocked", "Draft"], default: "Draft" },
  approvalL1: { type: String, enum: ["N/A", "Pending", "Approved"], default: "Pending" },
  approvalL2: { type: String, enum: ["N/A", "Pending", "Approved"], default: "Pending" },
  justification: String,
  createdBy: String,
  date: String,
  priority: { type: String, enum: ["Urgent", "Normal", "Low"], default: "Normal" },
  applicatedArea: String,
  requirementBy: String,
  location: String,
}, { timestamps: true });

POSchema.index({ id: 1 });
POSchema.index({ project: 1 });
POSchema.index({ vendor: 1 });
POSchema.index({ status: 1 });
POSchema.index({ updatedAt: -1 });

export const PurchaseOrder = mongoose.model('PurchaseOrder', POSchema);

// Material Plan Model
const PlanLineItemSchema = new Schema({
  sku: String,
  name: String,
  required: Number,
  unit: String,
  available: Number,
  reusable: Number,
  shortage: Number,
  priority: { type: String, enum: ["High", "Medium", "Low"] },
  delivery: String,
  activity: String,
});

const MaterialPlanSchema = new Schema({
  id: { type: String, required: true, unique: true },
  project: String,
  milestone: String,
  workType: String,
  date: String,
  status: { type: String, enum: ["Open", "PO Raised", "Fulfilled"], default: "Open" },
  items: [PlanLineItemSchema],
}, { timestamps: true });

MaterialPlanSchema.index({ id: 1 });
MaterialPlanSchema.index({ project: 1 });
MaterialPlanSchema.index({ status: 1 });
MaterialPlanSchema.index({ updatedAt: -1 });

export const MaterialPlan = mongoose.model('MaterialPlan', MaterialPlanSchema);

// GRN Model
const GRNItemSchema = new Schema({
  sku: String,
  name: String,
  ordered: Number,
  received: Number,
  variance: Number,
});

const GRNSchema = new Schema({
  id: { type: String, required: true, unique: true },
  poId: String,
  project: String,
  vendor: String,
  date: String,
  challan: String,
  mrNo: String,
  docType: { type: String, enum: ["Challan", "Invoice", "Bilty", "Gate Pass", "Without Challan", "Without Gate Pass"] },
  items: [GRNItemSchema],
  status: { type: String, enum: ["Draft", "Confirmed"], default: "Draft" },
  materialImageUrl: String,
  challanImageUrl: String,
}, { timestamps: true });

GRNSchema.index({ id: 1 });
GRNSchema.index({ poId: 1 });
GRNSchema.index({ project: 1 });
GRNSchema.index({ updatedAt: -1 });

export const GRN = mongoose.model('GRN', GRNSchema);

// Inward Model
const InwardSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sku: String,
  name: String,
  qty: Number,
  unit: String,
  date: String,
  challanNo: String,
  mrNo: String,
  supplier: String,
  type: { type: String, enum: ["GRN", "Manual"] },
  grnRef: String,
  project: String,
  category: String,
  materialPhotoUrl: String,
  personPhotoUrl: String,
}, { timestamps: true });

InwardSchema.index({ id: 1 });
InwardSchema.index({ sku: 1 });
InwardSchema.index({ project: 1 });
InwardSchema.index({ updatedAt: -1 });

export const Inward = mongoose.model('Inward', InwardSchema);

// Outward Model
const OutwardSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sku: String,
  name: String,
  qty: Number,
  unit: String,
  date: String,
  location: String,
  handoverTo: String,
  project: String,
  category: String,
  materialPhotoUrl: String,
  handoverPhotoUrl: String,
}, { timestamps: true });

OutwardSchema.index({ id: 1 });
OutwardSchema.index({ sku: 1 });
OutwardSchema.index({ project: 1 });
OutwardSchema.index({ updatedAt: -1 });

export const Outward = mongoose.model('Outward', OutwardSchema);

// Material Transfer Outward Model
const MaterialTransferOutwardSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sku: String,
  name: String,
  qty: Number,
  unit: String,
  date: String,
  fromLocation: String,
  toLocation: String,
  handoverTo: String,
  project: String,
  category: String,
  materialPhotoUrl: String,
  handoverPhotoUrl: String,
  remarks: String,
  module: { type: String, default: "Admin" },
}, { timestamps: true });

MaterialTransferOutwardSchema.index({ id: 1 });
MaterialTransferOutwardSchema.index({ sku: 1 });
MaterialTransferOutwardSchema.index({ fromLocation: 1 });
MaterialTransferOutwardSchema.index({ toLocation: 1 });
MaterialTransferOutwardSchema.index({ updatedAt: -1 });

export const MaterialTransferOutward = mongoose.model('MaterialTransferOutward', MaterialTransferOutwardSchema);

// Material Transfer Inward Model
const MaterialTransferInwardSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sku: String,
  name: String,
  qty: Number,
  unit: String,
  date: String,
  location: String,
  receivedBy: String,
  project: String,
  category: String,
  materialPhotoUrl: String,
  personPhotoUrl: String,
  remarks: String,
  module: { type: String, default: "Admin" },
}, { timestamps: true });

MaterialTransferInwardSchema.index({ id: 1 });
MaterialTransferInwardSchema.index({ sku: 1 });
MaterialTransferInwardSchema.index({ location: 1 });
MaterialTransferInwardSchema.index({ updatedAt: -1 });

export const MaterialTransferInward = mongoose.model('MaterialTransferInward', MaterialTransferInwardSchema);

// Inward Return Model
const InwardReturnSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  unit: { type: String, required: true },
  date: { type: String, required: true },
  condition: { type: String, enum: ["New", "Good", "Needs Repair", "Damaged"], default: "Good" },
  vendor: { type: String, required: true },
  remarks: String,
  handoverTo: String,
}, { timestamps: true });

export const InwardReturn = mongoose.model('InwardReturn', InwardReturnSchema);

// Outward Return Model
const OutwardReturnSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  unit: { type: String, required: true },
  date: { type: String, required: true },
  condition: { type: String, enum: ["New", "Good", "Needs Repair", "Damaged"], default: "Good" },
  sourceSite: { type: String, required: true },
  remarks: String,
  handoverFrom: String,
}, { timestamps: true });

export const OutwardReturn = mongoose.model('OutwardReturn', OutwardReturnSchema);

// Write Off Model
const WriteOffSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sku: String,
  name: String,
  qty: Number,
  unit: String,
  reason: String,
  requestedBy: String,
  date: String,
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
}, { timestamps: true });

export const WriteOff = mongoose.model('WriteOff', WriteOffSchema);

// Stock Check Report Model
const StockCheckItemSchema = new Schema({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  systemStock: { type: Number, required: true },
  physicalStock: { type: Number, required: true },
  variance: { type: Number, required: true },
  unit: { type: String, required: true },
});

const StockCheckReportSchema = new Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  category: { type: String, required: true },
  performedBy: { type: String, required: true },
  items: [StockCheckItemSchema],
  status: { type: String, enum: ["Completed"], default: "Completed" },
}, { timestamps: true });

StockCheckReportSchema.index({ id: 1 });
StockCheckReportSchema.index({ date: 1 });
StockCheckReportSchema.index({ category: 1 });

export const StockCheckReport = mongoose.model('StockCheckReport', StockCheckReportSchema);

// User Model
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Super Admin", "Director", "AGM", "Project Manager", "Store Incharge", "Inventory Manager", "Site Engineer", "Vendor", "Accountant"], default: "Site Engineer" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

UserSchema.index({ email: 1 });

export const User = mongoose.model('User', UserSchema);

// Settings Model
const SettingsSchema = new Schema({
  poThreshold: { type: Number, default: 25000 },
  minQuotesLow: { type: Number, default: 2 },
  minQuotesHigh: { type: Number, default: 3 },
}, { timestamps: true });

export const Settings = mongoose.model('Settings', SettingsSchema);

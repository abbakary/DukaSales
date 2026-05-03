// Business Types
export type BusinessType = 'retail' | 'pharmacy' | 'building' | 'wholesale';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier';

export type UnitType = 'piece' | 'kg' | 'g' | 'ton' | 'tan' | 'meter' | 'cm' | 'liter' | 'ml' | 'box' | 'pack' | 'dozen' | 'strip' | 'bottle' | 'vial' | 'ampoule' | 'tube' | 'sachet' | 'tin';

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'credit' | 'partial';

export type TransactionStatus = 'completed' | 'pending' | 'cancelled' | 'refunded' | 'on_hold';

export type SyncStatus = 'pending' | 'synced' | 'failed';

// Core Entities
export interface Company {
  id: string;
  name: string;
  types: BusinessType[];
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  currency: string;
  currencySymbol: string;
  subscriptionPlan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscriptionExpiry?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Enhanced company details for professional documents
  vrn_no?: string;
  tin_no?: string;
  website?: string;
  physical_address?: string;
  postal_address?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  business_license_no?: string;
  business_registration_no?: string;
  business_type?: string;
  industry?: string;
  year_established?: number;
  contact_person?: string;
  contact_person_title?: string;
  alternative_phone?: string;
  fax?: string;
  whatsapp?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  document_prefix?: string;
  document_footer?: string;
  document_header?: string;
}

export interface StaffSalary {
  id: string;
  companyId: string;
  staffId: string;
  staffName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  status: 'paid' | 'pending' | 'cancelled';
  month: string; // e.g., "2024-01"
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expenditure {
  id: string;
  companyId: string;
  category: string;
  amount: number;
  date: Date;
  paymentMethod: PaymentMethod;
  description?: string;
  referenceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  companyId: string;
  name: string;
  parentId?: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId: string;
  businessType?: BusinessType;
  sku: string;
  barcode?: string;
  qrCode?: string;
  name: string;
  description?: string;
  image?: string;
  
  // Pricing
  costPrice: number;
  sellingPrice: number;
  minPrice?: number; // For custom pricing (building/wholesale)
  taxRate?: number; // Tax percentage
  
  // Stock
  quantity: number;
  minStock: number;
  maxStock?: number;
  
  // Units
  unit: UnitType;
  allowDecimalQuantity: boolean;
  
  // Bulk pricing (for building/wholesale)
  bulkPricing?: BulkPriceRule[];
  
  // Pharmacy specific
  genericName?: string;
  brandName?: string;
  dosage?: string; // e.g., 500mg
  form?: string; // tablet, syrup, cream
  requiresPrescription?: boolean;
  unitsPerPack?: number; // e.g., 10 tablets per strip
  
  // Stock Tracking
  expiryDate?: Date;
  batchNumber?: string;
  batches?: ProductBatch[];
  
  // Variants
  hasVariants: boolean;
  variants?: ProductVariant[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  costPrice?: number;
  sellingPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  attributes: Record<string, string>; // e.g., { color: 'red', size: 'M' }
}

export interface BulkPriceRule {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  discountPercent?: number;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  creditLimit: number;
  currentDebt: number;
  loyaltyPoints: number;
  priceLevel?: 'regular' | 'wholesale' | 'vip';
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Enhanced customer details for professional documents
  customer_number?: string;
  tax_id?: string;
  vrn_no?: string;
  physical_address?: string;
  postal_address?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  business_name?: string;
  business_type?: string;
  contact_person?: string;
  contact_person_title?: string;
  website?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_region?: string;
  shipping_country?: string;
  shipping_postal_code?: string;
  alternative_phone?: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  currentDebt: number;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transactions
export interface Transaction {
  id: string;
  companyId: string;
  transactionNumber: string;
  type: 'sale' | 'return' | 'refund';
  status: TransactionStatus;
  
  // Customer
  customerId?: string;
  customerName?: string;
  
  // Items
  items: TransactionItem[];
  
  // Totals
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxPercent: number;
  total: number;
  
  // Payment
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  amountDue: number; // For credit sales
  
  // Metadata
  notes?: string;
  cashierId: string;
  cashierName: string;
  
  // Sync
  syncStatus: SyncStatus;
  
  // Return/Refund tracking
  originalTransactionNumber?: string;
  originalTransactionId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantId?: string;
  variantName?: string;
  
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  costPrice: number;
  
  taxRate?: number; // Tax percentage
  taxAmount?: number; // Actual tax amount calculated
  
  discountAmount: number;
  discountPercent: number;
  
  total: number;
  
  // For pharmacy
  batchNumber?: string;
  expiryDate?: Date;
  dosage?: string;
  requiresPrescription?: boolean;
  isPack?: boolean; // Whether sold as a pack (strip/bottle) or unit (tablet)
}

// Purchase Orders
export interface PurchaseOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  
  status: 'draft' | 'ordered' | 'received' | 'partial' | 'cancelled';
  
  items: PurchaseItem[];
  
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost: number;
  otherCosts: number;
  total: number;
  
  amountPaid: number;
  amountDue: number;
  
  expectedDate?: Date;
  receivedDate?: Date;
  
  notes?: string;
  
  syncStatus: SyncStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  
  orderedQuantity: number;
  receivedQuantity: number;
  unit: UnitType;
  
  unitCost: number;
  taxRate?: number; // Tax percentage
  taxAmount?: number;
  total: number;
  
  // For pharmacy
  batchNumber?: string;
  expiryDate?: Date;
}

// Credit/Debt Management
export interface Debt {
  id: string;
  companyId: string;
  type: 'receivable' | 'payable';
  
  // Customer or Supplier
  entityType: 'customer' | 'supplier';
  entityId: string;
  entityName: string;
  
  // Reference
  referenceType: 'sale' | 'purchase';
  referenceId: string;
  referenceNumber: string;
  
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  
  dueDate?: Date;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'written_off';
  
  payments: DebtPayment[];
  
  notes?: string;
  
  syncStatus: SyncStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  receivedBy: string;
  createdAt: Date;
}

// Stock Movements
export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  
  type: 'in' | 'out' | 'adjustment';
  reason: 'sale' | 'purchase' | 'return' | 'damage' | 'expired' | 'transfer' | 'adjustment';
  
  quantity: number;
  previousStock: number;
  newStock: number;
  
  referenceType?: 'transaction' | 'purchase' | 'adjustment';
  referenceId?: string;
  
  notes?: string;
  userId: string;
  
  syncStatus: SyncStatus;
  
  createdAt: Date;
}

// Sync Queue
export interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: Record<string, unknown>;
  status: SyncStatus;
  retryCount: number;
  error?: string;
  createdAt: Date;
}

// Cart (POS)
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  customPrice?: number;
  
  taxRate?: number; // Tax percentage
  
  discountAmount: number;
  discountPercent: number;
  
  total: number;
  
  // For pharmacy
  batchNumber?: string;
  expiryDate?: Date;
}

// Business Features Configuration
export interface BusinessFeatures {
  // Unit types
  supportsWeightUnit: boolean;
  supportsLengthUnit: boolean;
  supportsVolumeUnit: boolean;
  
  // Tracking
  hasExpiryTracking: boolean;
  hasBatchTracking: boolean;
  
  // Pricing
  allowsCustomPricing: boolean;
  hasBulkPricing: boolean;
  
  // Operations
  hasLogistics: boolean;
  hasPrepaidOrders: boolean;
  hasPrescriptionTracking: boolean;
  
  // Available units
  availableUnits: UnitType[];
}

// Auth
export interface AuthState {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalPurchases: number;
  totalProfit: number;
  profitMargin: number;
  topCustomer: string;
  topProduct?: string;
  salesCount: number;
  customersCount: number;
  suppliersCount: number;
  productsCount: number;
  lowStockCount: number;
  expiringCount: number;
  pendingDebtsCount: number;
  pendingDebtsAmount: number;
  // Return/Refund tracking
  grossRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  returnRate: number;
  refundedItems: number;
}

// Ads (Super Admin)
export interface Advertisement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  targetCompanyIds?: string[]; // Empty = all companies
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  maxUsers: number;
  maxProducts: number;
  maxLocations: number;
  isActive: boolean;
}

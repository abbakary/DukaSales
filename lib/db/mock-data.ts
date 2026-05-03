import { v4 as uuid } from 'uuid';
import type {
  Company,
  User,
  Category,
  Product,
  Customer,
  Supplier,
  Transaction,
  BusinessType,
} from '@/lib/types';

// Demo company data based on business type
export function createDemoCompany(types: BusinessType[], name: string): Company {
  return {
    id: uuid(),
    name,
    types,
    currency: 'TSH',
    currencySymbol: 'Tsh',
    subscriptionPlan: 'pro',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createDemoUser(companyId: string, email: string, name: string, role: 'admin' | 'manager' | 'cashier' = 'admin'): User {
  return {
    id: uuid(),
    companyId,
    email,
    name,
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Category templates by business type
const categoryTemplates: Record<BusinessType, { name: string; subcategories: string[] }[]> = {
  retail: [
    { name: 'Electronics', subcategories: ['Phones', 'Accessories', 'Computers'] },
    { name: 'Clothing', subcategories: ['Men', 'Women', 'Kids'] },
    { name: 'Food & Beverages', subcategories: ['Snacks', 'Drinks', 'Dairy'] },
    { name: 'Household', subcategories: ['Cleaning', 'Kitchen', 'Decor'] },
    { name: 'Personal Care', subcategories: ['Skincare', 'Haircare', 'Hygiene'] },
  ],
  pharmacy: [
    { name: 'Prescription Drugs', subcategories: ['Antibiotics', 'Pain Relief', 'Chronic Care'] },
    { name: 'Over The Counter', subcategories: ['Cold & Flu', 'Vitamins', 'First Aid'] },
    { name: 'Personal Care', subcategories: ['Skincare', 'Oral Care', 'Baby Care'] },
    { name: 'Medical Devices', subcategories: ['Monitors', 'Supports', 'Mobility'] },
    { name: 'Health Foods', subcategories: ['Supplements', 'Diet', 'Organic'] },
  ],
  building: [
    { name: 'Lumber', subcategories: ['Plywood', 'Boards', 'Beams'] },
    { name: 'Cement & Concrete', subcategories: ['Cement Bags', 'Blocks', 'Sand'] },
    { name: 'Steel & Metal', subcategories: ['Rebar', 'Sheets', 'Pipes'] },
    { name: 'Plumbing', subcategories: ['Pipes', 'Fittings', 'Fixtures'] },
    { name: 'Electrical', subcategories: ['Wires', 'Switches', 'Panels'] },
    { name: 'Paint & Finishes', subcategories: ['Interior', 'Exterior', 'Coatings'] },
  ],
  wholesale: [
    { name: 'Food & Beverages', subcategories: ['Canned Goods', 'Beverages', 'Frozen'] },
    { name: 'Cleaning Supplies', subcategories: ['Detergents', 'Chemicals', 'Tools'] },
    { name: 'Paper Products', subcategories: ['Tissues', 'Packaging', 'Office'] },
    { name: 'Personal Care', subcategories: ['Toiletries', 'Cosmetics', 'Health'] },
    { name: 'Household Items', subcategories: ['Plasticware', 'Glassware', 'Kitchen'] },
  ],
};

export function createDemoCategories(companyId: string, businessTypes: BusinessType[]): Category[] {
  const categories: Category[] = [];
  
  businessTypes.forEach(type => {
    const templates = categoryTemplates[type];
    templates.forEach((template, index) => {
      const parentId = uuid();
      
      // Parent category
      categories.push({
        id: parentId,
        companyId,
        name: `${template.name} (${type.toUpperCase()})`,
        sortOrder: index,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Subcategories
      template.subcategories.forEach((subName, subIndex) => {
        categories.push({
          id: uuid(),
          companyId,
          parentId,
          name: subName,
          sortOrder: subIndex,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });
  });
  
  return categories;
}

// Product templates by business type
const productTemplates: Record<BusinessType, Partial<Product>[]> = {
  retail: [
    { name: 'iPhone Case', sku: 'ACC-001', costPrice: 5, sellingPrice: 15, unit: 'piece', quantity: 100 },
    { name: 'USB Cable', sku: 'ACC-002', costPrice: 2, sellingPrice: 8, unit: 'piece', quantity: 200 },
    { name: 'T-Shirt Basic', sku: 'CLT-001', costPrice: 8, sellingPrice: 25, unit: 'piece', quantity: 50 },
    { name: 'Jeans Denim', sku: 'CLT-002', costPrice: 20, sellingPrice: 55, unit: 'piece', quantity: 30 },
    { name: 'Coca Cola 500ml', sku: 'BEV-001', costPrice: 0.5, sellingPrice: 1.5, unit: 'piece', quantity: 500 },
    { name: 'Chips Large', sku: 'SNK-001', costPrice: 1, sellingPrice: 3, unit: 'piece', quantity: 200 },
    { name: 'Hand Soap', sku: 'HYG-001', costPrice: 1.5, sellingPrice: 4, unit: 'piece', quantity: 150 },
    { name: 'Kitchen Cleaner', sku: 'CLN-001', costPrice: 2, sellingPrice: 6, unit: 'piece', quantity: 100 },
  ],
  pharmacy: [
    { name: 'Panadol (Paracetamol)', genericName: 'Paracetamol', dosage: '500mg', form: 'tablet', sku: 'MED-001', costPrice: 2000, sellingPrice: 3500, unit: 'strip', quantity: 200, requiresPrescription: false, unitsPerPack: 10 },
    { name: 'Amoxy-Care (Amoxicillin)', genericName: 'Amoxicillin', dosage: '500mg', form: 'capsule', sku: 'MED-002', costPrice: 8000, sellingPrice: 12000, unit: 'strip', quantity: 100, requiresPrescription: true, unitsPerPack: 10 },
    { name: 'Malu-1 (AL)', genericName: 'Artemether/Lumefantrine', dosage: '20/120mg', form: 'tablet', sku: 'MED-003', costPrice: 5000, sellingPrice: 8500, unit: 'box', quantity: 150, requiresPrescription: false, unitsPerPack: 24 },
    { name: 'Flagyl (Metronidazole)', genericName: 'Metronidazole', dosage: '400mg', form: 'tablet', sku: 'MED-004', costPrice: 3000, sellingPrice: 5000, unit: 'strip', quantity: 120, requiresPrescription: true, unitsPerPack: 10 },
    { name: 'Ventolin Inhaler', genericName: 'Salbutamol', dosage: '100mcg', form: 'inhaler', sku: 'MED-005', costPrice: 15000, sellingPrice: 22000, unit: 'bottle', quantity: 30, requiresPrescription: true, unitsPerPack: 1 },
    { name: 'Zentel (Albendazole)', genericName: 'Albendazole', dosage: '400mg', form: 'tablet', sku: 'MED-006', costPrice: 1500, sellingPrice: 2500, unit: 'piece', quantity: 200, requiresPrescription: false, unitsPerPack: 1 },
  ],
  building: [
    { name: 'Portland Cement 50kg', sku: 'CEM-001', costPrice: 8, sellingPrice: 12, unit: 'piece', quantity: 500, allowDecimalQuantity: false },
    { name: 'Rebar 12mm (6m)', sku: 'STL-001', costPrice: 6, sellingPrice: 10, unit: 'piece', quantity: 300 },
    { name: 'Plywood 4x8 ft', sku: 'WOD-001', costPrice: 25, sellingPrice: 40, unit: 'piece', quantity: 100 },
    { name: 'Sand (per ton)', sku: 'AGG-001', costPrice: 30, sellingPrice: 50, unit: 'kg', quantity: 50000, allowDecimalQuantity: true },
    { name: 'PVC Pipe 4 inch (6m)', sku: 'PIP-001', costPrice: 12, sellingPrice: 20, unit: 'piece', quantity: 150 },
    { name: 'Electrical Wire (per m)', sku: 'ELE-001', costPrice: 1, sellingPrice: 2.5, unit: 'meter', quantity: 5000, allowDecimalQuantity: true },
    { name: 'Paint Emulsion 20L', sku: 'PNT-001', costPrice: 40, sellingPrice: 65, unit: 'piece', quantity: 80 },
    { name: 'Roofing Sheets', sku: 'ROF-001', costPrice: 15, sellingPrice: 25, unit: 'piece', quantity: 200 },
  ],
  wholesale: [
    { name: 'Rice 25kg Bag', sku: 'GRN-001', costPrice: 20, sellingPrice: 28, unit: 'piece', quantity: 200 },
    { name: 'Cooking Oil 20L', sku: 'OIL-001', costPrice: 30, sellingPrice: 42, unit: 'piece', quantity: 150 },
    { name: 'Sugar 50kg', sku: 'GRN-002', costPrice: 35, sellingPrice: 48, unit: 'piece', quantity: 100 },
    { name: 'Detergent 5kg', sku: 'CLN-001', costPrice: 8, sellingPrice: 14, unit: 'piece', quantity: 300, bulkPricing: [{ minQuantity: 10, price: 13 }, { minQuantity: 50, price: 12 }] },
    { name: 'Toilet Paper (48 rolls)', sku: 'PPR-001', costPrice: 15, sellingPrice: 24, unit: 'pack', quantity: 200 },
    { name: 'Soft Drinks (24 pack)', sku: 'BEV-001', costPrice: 10, sellingPrice: 16, unit: 'pack', quantity: 400, bulkPricing: [{ minQuantity: 10, price: 15 }, { minQuantity: 50, price: 14 }] },
    { name: 'Canned Beans (case of 24)', sku: 'CAN-001', costPrice: 18, sellingPrice: 28, unit: 'box', quantity: 150 },
    { name: 'Flour 25kg', sku: 'GRN-003', costPrice: 15, sellingPrice: 22, unit: 'piece', quantity: 180 },
  ],
};

export function createDemoProducts(companyId: string, businessTypes: BusinessType[], categories: Category[]): Product[] {
  const allProducts: Product[] = [];
  
  businessTypes.forEach(type => {
    const templates = productTemplates[type];
    const typeCategories = categories.filter(c => !c.parentId && c.name.includes(`(${type.toUpperCase()})`));
    
    const products = templates.map((template, index) => {
      const category = typeCategories[index % typeCategories.length];
      const expiryDate = type === 'pharmacy' 
        ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000) // Random expiry within a year
        : undefined;
      
      return {
        id: uuid(),
        companyId,
        categoryId: category.id,
        businessType: type,
        sku: `${template.sku!}-${type[0].toUpperCase()}`,
        name: template.name!,
        genericName: template.genericName,
        dosage: template.dosage,
        form: template.form,
        costPrice: template.costPrice!,
        sellingPrice: template.sellingPrice!,
        quantity: template.quantity!,
        minStock: 10,
        unit: template.unit || 'piece',
        unitsPerPack: template.unitsPerPack || 1,
        allowDecimalQuantity: template.allowDecimalQuantity ?? false,
        bulkPricing: template.bulkPricing,
        expiryDate,
        batchNumber: type === 'pharmacy' ? `BATCH-${Date.now()}-${index}` : undefined,
        requiresPrescription: template.requiresPrescription,
        hasVariants: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;
    });
    allProducts.push(...products);
  });
  
  return allProducts;
}

export function createDemoCustomers(companyId: string): Customer[] {
  const names = [
    { name: 'John Smith', phone: '+1234567890', email: 'john@example.com' },
    { name: 'Sarah Johnson', phone: '+1234567891', email: 'sarah@example.com' },
    { name: 'Mike Williams', phone: '+1234567892', email: 'mike@example.com' },
    { name: 'Emma Brown', phone: '+1234567893', email: 'emma@example.com' },
    { name: 'David Miller', phone: '+1234567894', email: 'david@example.com' },
    { name: 'Lisa Davis', phone: '+1234567895', email: 'lisa@example.com' },
    { name: 'Walk-in Customer', phone: '', email: '' },
  ];
  
  return names.map((customer, index) => ({
    id: uuid(),
    companyId,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    creditLimit: index === 6 ? 0 : 500 + (index * 100),
    currentDebt: index === 6 ? 0 : Math.random() * 200,
    loyaltyPoints: Math.floor(Math.random() * 1000),
    priceLevel: index < 2 ? 'vip' : index < 4 ? 'wholesale' : 'regular',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as Customer[];
}

export function createDemoSuppliers(companyId: string, businessTypes: BusinessType[]): Supplier[] {
  const allSuppliers: Supplier[] = [];
  
  const suppliersByType: Record<BusinessType, { name: string; contact: string }[]> = {
    retail: [
      { name: 'Tech Distributors Inc', contact: 'tech@example.com' },
      { name: 'Fashion Wholesale Co', contact: 'fashion@example.com' },
      { name: 'Food & Beverage Supply', contact: 'food@example.com' },
    ],
    pharmacy: [
      { name: 'MediPharma Distributors', contact: 'medi@example.com' },
      { name: 'HealthCare Supplies', contact: 'health@example.com' },
      { name: 'Medical Equipment Co', contact: 'equip@example.com' },
    ],
    building: [
      { name: 'Cement & Steel Corp', contact: 'cement@example.com' },
      { name: 'Lumber & Wood Supply', contact: 'lumber@example.com' },
      { name: 'Plumbing & Electrical', contact: 'plumb@example.com' },
    ],
    wholesale: [
      { name: 'Bulk Foods International', contact: 'bulk@example.com' },
      { name: 'Consumer Goods Wholesale', contact: 'consumer@example.com' },
      { name: 'Industrial Supplies Ltd', contact: 'industrial@example.com' },
    ],
  };
  
  businessTypes.forEach(type => {
    const suppliers = suppliersByType[type].map(supplier => ({
      id: uuid(),
      companyId,
      name: `${supplier.name} (${type.toUpperCase()})`,
      contactPerson: supplier.contact.split('@')[0],
      email: supplier.contact,
      phone: '+1234567800',
      currentDebt: Math.random() * 1000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    allSuppliers.push(...suppliers as Supplier[]);
  });
  
  return allSuppliers;
}

export function createDemoTransactions(
  companyId: string,
  products: Product[],
  customers: Customer[],
  cashierName: string
): Transaction[] {
  const transactions: Transaction[] = [];
  const statuses: ('completed' | 'pending')[] = ['completed', 'completed', 'completed', 'pending'];
  const paymentMethods: ('cash' | 'card' | 'credit')[] = ['cash', 'cash', 'card', 'credit'];
  
  // Generate 20 sample transactions over the past 30 days
  for (let i = 0; i < 20; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const numItems = 1 + Math.floor(Math.random() * 4);
    const items = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = 1 + Math.floor(Math.random() * 5);
      const total = product.sellingPrice * quantity;
      subtotal += total;
      
      items.push({
        id: uuid(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unit: product.unit,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        discountAmount: 0,
        discountPercent: 0,
        total,
      });
    }
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const taxAmount = subtotal * 0.1;
    const total = subtotal + taxAmount;
    
    transactions.push({
      id: uuid(),
      companyId,
      transactionNumber: `TXN-${String(i + 1).padStart(5, '0')}`,
      type: 'sale',
      status,
      customerId: customer.id,
      customerName: customer.name,
      items,
      subtotal,
      discountAmount: 0,
      discountPercent: 0,
      taxAmount,
      taxPercent: 10,
      total,
      paymentMethod,
      amountPaid: paymentMethod === 'credit' ? 0 : total,
      change: 0,
      amountDue: paymentMethod === 'credit' ? total : 0,
      cashierId: uuid(),
      cashierName,
      syncStatus: 'synced',
      createdAt: date,
      updatedAt: date,
    } as Transaction);
  }
  
  return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Initialize demo data for a company
export async function initializeDemoData(
  businessTypes: BusinessType[],
  companyName: string,
  userName: string,
  userEmail: string
) {
  const company = createDemoCompany(businessTypes, companyName);
  const user = createDemoUser(company.id, userEmail, userName, 'admin');
  const categories = createDemoCategories(company.id, businessTypes);
  const products = createDemoProducts(company.id, businessTypes, categories);
  const customers = createDemoCustomers(company.id);
  const suppliers = createDemoSuppliers(company.id, businessTypes);
  const transactions = createDemoTransactions(company.id, products, customers, userName);
  
  return {
    company,
    user,
    categories,
    products,
    customers,
    suppliers,
    transactions,
  };
}

// Pre-generated mock data for default company
const defaultCompanyId = 'company-1';

export const mockCategories: Category[] = createDemoCategories(defaultCompanyId, ['retail']);
export const mockProducts: Product[] = createDemoProducts(defaultCompanyId, ['retail'], mockCategories);
export const mockCustomers: Customer[] = createDemoCustomers(defaultCompanyId);
export const mockSuppliers: Supplier[] = createDemoSuppliers(defaultCompanyId, ['retail']);
export const mockTransactions: Transaction[] = createDemoTransactions(
  defaultCompanyId,
  mockProducts,
  mockCustomers,
  'Demo User'
);

// Purchase orders mock
import type { PurchaseOrder } from '@/lib/types';

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: uuid(),
    companyId: defaultCompanyId,
    orderNumber: 'PO-00001',
    supplierId: mockSuppliers[0]?.id || '',
    supplierName: mockSuppliers[0]?.name || 'Tech Distributors Inc',
    status: 'received',
    items: [
      {
        id: uuid(),
        productId: mockProducts[0]?.id || '',
        productName: mockProducts[0]?.name || 'iPhone Case',
        sku: mockProducts[0]?.sku || 'ACC-001',
        orderedQuantity: 100,
        receivedQuantity: 100,
        unit: 'piece',
        unitCost: 5,
        total: 500,
      },
    ],
    subtotal: 500,
    discountAmount: 0,
    taxAmount: 50,
    shippingCost: 20,
    otherCosts: 0,
    total: 570,
    amountPaid: 570,
    amountDue: 0,
    expectedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    receivedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: uuid(),
    companyId: defaultCompanyId,
    orderNumber: 'PO-00002',
    supplierId: mockSuppliers[1]?.id || '',
    supplierName: mockSuppliers[1]?.name || 'Fashion Wholesale Co',
    status: 'ordered',
    items: [
      {
        id: uuid(),
        productId: mockProducts[2]?.id || '',
        productName: mockProducts[2]?.name || 'T-Shirt Basic',
        sku: mockProducts[2]?.sku || 'CLT-001',
        orderedQuantity: 50,
        receivedQuantity: 0,
        unit: 'piece',
        unitCost: 8,
        total: 400,
      },
      {
        id: uuid(),
        productId: mockProducts[3]?.id || '',
        productName: mockProducts[3]?.name || 'Jeans Denim',
        sku: mockProducts[3]?.sku || 'CLT-002',
        orderedQuantity: 30,
        receivedQuantity: 0,
        unit: 'piece',
        unitCost: 20,
        total: 600,
      },
    ],
    subtotal: 1000,
    discountAmount: 50,
    taxAmount: 95,
    shippingCost: 30,
    otherCosts: 0,
    total: 1075,
    amountPaid: 500,
    amountDue: 575,
    expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: uuid(),
    companyId: defaultCompanyId,
    orderNumber: 'PO-00003',
    supplierId: mockSuppliers[2]?.id || '',
    supplierName: mockSuppliers[2]?.name || 'Food & Beverage Supply',
    status: 'partial',
    items: [
      {
        id: uuid(),
        productId: mockProducts[4]?.id || '',
        productName: mockProducts[4]?.name || 'Coca Cola 500ml',
        sku: mockProducts[4]?.sku || 'BEV-001',
        orderedQuantity: 500,
        receivedQuantity: 300,
        unit: 'piece',
        unitCost: 0.5,
        total: 250,
      },
    ],
    subtotal: 250,
    discountAmount: 0,
    taxAmount: 25,
    shippingCost: 15,
    otherCosts: 0,
    total: 290,
    amountPaid: 150,
    amountDue: 140,
    expectedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

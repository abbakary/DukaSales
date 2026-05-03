import Dexie, { type Table } from 'dexie';
import type {
  Product,
  ProductBatch,
  Category,
  Customer,
  Supplier,
  Transaction,
  PurchaseOrder,
  Debt,
  StockMovement,
  SyncOperation,
} from '@/lib/types';

export class POSDatabase extends Dexie {
  products!: Table<Product>;
  productBatches!: Table<ProductBatch>;
  categories!: Table<Category>;
  customers!: Table<Customer>;
  suppliers!: Table<Supplier>;
  transactions!: Table<Transaction>;
  purchaseOrders!: Table<PurchaseOrder>;
  debts!: Table<Debt>;
  stockMovements!: Table<StockMovement>;
  syncQueue!: Table<SyncOperation>;

  constructor() {
    super('pos-database');
    
    this.version(1).stores({
      products: 'id, companyId, categoryId, sku, barcode, name, [companyId+categoryId], [companyId+isActive]',
      productBatches: 'id, productId, batchNumber, expiryDate, [productId+batchNumber]',
      categories: 'id, companyId, parentId, name, [companyId+isActive]',
      customers: 'id, companyId, name, phone, email, [companyId+isActive]',
      suppliers: 'id, companyId, name, phone, [companyId+isActive]',
      transactions: 'id, companyId, transactionNumber, type, status, customerId, createdAt, [companyId+status], [companyId+createdAt]',
      purchaseOrders: 'id, companyId, orderNumber, supplierId, status, createdAt, [companyId+status]',
      debts: 'id, companyId, type, entityId, status, dueDate, [companyId+type+status]',
      stockMovements: 'id, companyId, productId, type, createdAt, [companyId+productId]',
      syncQueue: 'id, status, entity, createdAt',
    });
  }
}

export const db = new POSDatabase();

// Helper functions for common queries
export async function getProductsByCompany(companyId: string, onlyActive = true) {
  if (onlyActive) {
    return db.products.where({ companyId, isActive: true }).toArray();
  }
  return db.products.where('companyId').equals(companyId).toArray();
}

export async function getProductsByCategory(companyId: string, categoryId: string) {
  return db.products.where({ companyId, categoryId, isActive: true }).toArray();
}

export async function getCategoriesByCompany(companyId: string, onlyActive = true) {
  if (onlyActive) {
    return db.categories.where({ companyId, isActive: true }).toArray();
  }
  return db.categories.where('companyId').equals(companyId).toArray();
}

export async function getCustomersByCompany(companyId: string, onlyActive = true) {
  if (onlyActive) {
    return db.customers.where({ companyId, isActive: true }).toArray();
  }
  return db.customers.where('companyId').equals(companyId).toArray();
}

export async function getSuppliersByCompany(companyId: string, onlyActive = true) {
  if (onlyActive) {
    return db.suppliers.where({ companyId, isActive: true }).toArray();
  }
  return db.suppliers.where('companyId').equals(companyId).toArray();
}

export async function getTransactionsByCompany(companyId: string, limit = 50) {
  return db.transactions
    .where('companyId')
    .equals(companyId)
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getDebtsByCompany(companyId: string, type?: 'receivable' | 'payable') {
  if (type) {
    return db.debts.where({ companyId, type }).toArray();
  }
  return db.debts.where('companyId').equals(companyId).toArray();
}

export async function getPendingSync() {
  return db.syncQueue.where('status').equals('pending').toArray();
}

export async function addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount'>) {
  return db.syncQueue.add({
    ...operation,
    id: crypto.randomUUID(),
    status: 'pending',
    retryCount: 0,
    createdAt: new Date(),
  });
}

export async function clearSyncedOperations() {
  return db.syncQueue.where('status').equals('synced').delete();
}

// Stock operations
export async function updateProductStock(productId: string, quantityChange: number) {
  return db.products.where('id').equals(productId).modify((product) => {
    product.quantity += quantityChange;
    product.updatedAt = new Date();
  });
}

// Initialize database with company data check
export async function initializeDatabase() {
  try {
    await db.open();
    console.log('[v0] Database initialized successfully');
    return true;
  } catch (error) {
    console.error('[v0] Failed to initialize database:', error);
    return false;
  }
}

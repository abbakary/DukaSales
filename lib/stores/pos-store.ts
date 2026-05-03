import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Customer, Transaction, PaymentMethod, UnitType, Product } from '@/lib/types';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from './auth-store';
import { completePosSale } from '@/lib/api/tenant';
import { syncTenantDataFromApi } from '@/lib/services/sync-from-api';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  unit: UnitType;
  taxRate?: number;  // Per-item tax rate
  taxType?: 'percentage' | 'fixed'; // Per-item tax type
  discount: number;
  variantId?: string;
  variantName?: string;
  
  // Pharmacy specific
  genericName?: string;
  dosage?: string;
  batchNumber?: string;
  expiryDate?: Date;
  requiresPrescription?: boolean;
  isPack?: boolean;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface HeldTransaction {
  id: string;
  items: CartItem[];
  customer: Customer | null;
  createdAt: Date;
}

interface POSState {
  // Cart
  items: CartItem[];
  selectedCustomer: Customer | null;
  
  // Held transactions
  heldTransactions: HeldTransaction[];
  
  // Discounts
  globalDiscount: number;
  globalDiscountType: 'percentage' | 'fixed';
  
  // Tax
  taxRate: number;
  taxType: 'percentage' | 'fixed';
  
  // Payments
  payments: Payment[];
  
  // UI State
  isPaymentModalOpen: boolean;
  isCustomerModalOpen: boolean;
  selectedCategory: string | null;
  searchQuery: string;

  // Computed values stored as state for reactivity
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

interface POSActions {
  // Cart operations
  addItem: (item: CartItem) => void;
  addPharmacyItem: (product: Product, quantity: number, isPack?: boolean) => Promise<void>;
  updateQuantity: (index: number, quantity: number) => void;
  updateItemPrice: (index: number, price: number) => void;
  updateItemDiscount: (index: number, discount: number) => void;
  updateItemTaxRate: (index: number, taxRate: number | undefined) => void;
  updateItemTaxType: (index: number, taxType: 'percentage' | 'fixed') => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  
  // Global discount
  setGlobalDiscount: (discount: number) => void;
  setGlobalDiscountType: (type: 'percentage' | 'fixed') => void;
  
  // Tax
  setTaxRate: (rate: number) => void;
  setTaxType: (type: 'percentage' | 'fixed') => void;
  
  // Customer
  setSelectedCustomer: (customer: Customer | null) => void;
  
  // Hold/Recall
  holdTransaction: () => void;
  recallTransaction: (id: string) => void;
  deleteHeldTransaction: (id: string) => void;
  
  // Payment
  addPayment: (payment: Payment) => void;
  removePayment: (index: number) => void;
  clearPayments: () => void;
  
  // Complete sale
  completeSale: (userId: string, dueDate?: string) => Promise<Transaction | null>;
  
  // UI
  setSelectedCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  openCustomerModal: () => void;
  closeCustomerModal: () => void;
  refreshTotals: () => void;
}

const calculateSubtotal = (items: CartItem[]) => {
  return items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = item.discount > 0 ? itemTotal * (item.discount / 100) : 0;
    return sum + (itemTotal - itemDiscount);
  }, 0);
};

const calculateDiscountAmount = (subtotal: number, globalDiscount: number, globalDiscountType: 'percentage' | 'fixed') => {
  if (globalDiscountType === 'percentage') {
    return subtotal * (globalDiscount / 100);
  }
  return globalDiscount;
};

// Calculate tax with support for per-item tax rates and types
// If item has its own taxRate/taxType, use those; otherwise use global values
const calculateTaxAmount = (items: CartItem[], discountAmount: number, globalTaxRate: number, globalTaxType: 'percentage' | 'fixed') => {
  let totalTax = 0;
  
  for (const item of items) {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = item.discount > 0 ? itemTotal * (item.discount / 100) : 0;
    const taxableAmount = itemTotal - itemDiscount;
    
    // Use per-item tax rate/type if specified, otherwise use global values
    const itemTaxRate = item.taxRate !== undefined ? item.taxRate : globalTaxRate;
    const itemTaxType = item.taxType !== undefined ? item.taxType : globalTaxType;
    
    if (itemTaxRate > 0) {
      if (itemTaxType === 'percentage') {
        totalTax += taxableAmount * (itemTaxRate / 100);
      } else {
        // Fixed tax amount per single item
        totalTax += itemTaxRate * item.quantity; 
      }
    }
  }
  
  return totalTax;
};

// Helper to calculate all totals at once
const getTotals = (state: Partial<POSState>) => {
  const items = state.items || [];
  const globalDiscount = state.globalDiscount ?? 0;
  const globalDiscountType = state.globalDiscountType || 'percentage';
  const taxRate = state.taxRate ?? 0;
  const taxType = state.taxType || 'percentage';

  const subtotal = calculateSubtotal(items);
  const discountAmount = calculateDiscountAmount(subtotal, globalDiscount, globalDiscountType);
  const taxAmount = calculateTaxAmount(items, discountAmount, taxRate, taxType);
  const total = subtotal - discountAmount + taxAmount;

  return { subtotal, discountAmount, taxAmount, total };
};

export const usePOSStore = create<POSState & POSActions>()(
  persist(
    (set, get) => ({
      items: [],
      selectedCustomer: null,
      heldTransactions: [],
      globalDiscount: 0,
      globalDiscountType: 'percentage',
      taxRate: 0,
      taxType: 'percentage',
      payments: [],
      isPaymentModalOpen: false,
      isCustomerModalOpen: false,
      selectedCategory: null,
      searchQuery: '',

      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,

      addItem: async (item: CartItem) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          i => i.productId === item.productId && i.variantId === item.variantId && i.batchNumber === item.batchNumber
        );
        
        let newItems;
        if (existingIndex >= 0) {
          newItems = [...items];
          newItems[existingIndex].quantity += item.quantity;
        } else {
          newItems = [...items, item];
        }

        const totals = getTotals({ ...get(), items: newItems });
        set({ items: newItems, ...totals });
      },

      addPharmacyItem: async (product: Product, quantity: number, isPack: boolean = false) => {
        const authState = useAuthStore.getState();
        const isPharmacy = authState.company?.types.includes('pharmacy');
        
        if (!isPharmacy) return;

        // FEFO: Find batches ordered by expiry date
        const batches = await db.productBatches
          .where('productId')
          .equals(product.id)
          .and(b => b.quantity > 0 && new Date(b.expiryDate) > new Date())
          .sortBy('expiryDate');

        let remainingQty = quantity;
        const newCartItems: CartItem[] = [];

        if (batches.length > 0) {
          for (const batch of batches) {
            if (remainingQty <= 0) break;
            const deduct = Math.min(batch.quantity, remainingQty);
            
            newCartItems.push({
              productId: product.id,
              name: product.name,
              sku: product.sku,
              price: isPack ? (product.sellingPrice * (product.unitsPerPack || 1)) : product.sellingPrice,
              quantity: deduct,
              unit: isPack ? 'pack' : product.unit,
              taxRate: product.taxRate,
              discount: 0,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              genericName: product.genericName,
              dosage: product.dosage,
              requiresPrescription: product.requiresPrescription,
              isPack
            });
            remainingQty -= deduct;
          }
        }

        // Fallback to product without batch if no batches found or remaining quantity
        if (remainingQty > 0) {
          newCartItems.push({
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price: isPack ? (product.sellingPrice * (product.unitsPerPack || 1)) : product.sellingPrice,
            quantity: remainingQty,
            unit: isPack ? 'pack' : product.unit,
            taxRate: product.taxRate,
            discount: 0,
            genericName: product.genericName,
            dosage: product.dosage,
            requiresPrescription: product.requiresPrescription,
            isPack
          });
        }

        for (const cartItem of newCartItems) {
          get().addItem(cartItem);
        }
      },

      updateQuantity: (index: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(index);
          return;
        }
        
        const { items } = get();
        const newItems = [...items];
        newItems[index] = { ...newItems[index], quantity };
        
        const totals = getTotals({ ...get(), items: newItems });
        set({ items: newItems, ...totals });
      },

      updateItemPrice: (index: number, price: number) => {
        const { items } = get();
        const newItems = [...items];
        newItems[index] = { ...newItems[index], price };
        
        const totals = getTotals({ ...get(), items: newItems });
        set({ items: newItems, ...totals });
      },

      updateItemDiscount: (index: number, discount: number) => {
        const { items } = get();
        const newItems = [...items];
        newItems[index] = { ...newItems[index], discount };
        
        const totals = getTotals({ ...get(), items: newItems });
        set({ items: newItems, ...totals });
      },

      updateItemTaxRate: (index: number, taxRate: number | undefined) => {
        const { items } = get();
        const newItems = [...items];
        newItems[index] = { ...newItems[index], taxRate };
        
        const totals = getTotals({ ...get(), items: newItems });
        set({ items: newItems, ...totals });
      },

      updateItemTaxType: (index: number, taxType: 'percentage' | 'fixed') => {
        const { items } = get();
        const newItems = [...items];
        newItems[index] = { ...newItems[index], taxType };
        
        const totals = getTotals({ ...get(), items: newItems });
        set({ items: newItems, ...totals });
      },

      removeItem: (index: number) => {
        const newItems = get().items.filter((_, i) => i !== index);
        const totals = getTotals({ ...get(), items: newItems });
        set({ items: newItems, ...totals });
      },

      clearCart: () => {
        set({
          items: [],
          selectedCustomer: null,
          globalDiscount: 0,
          globalDiscountType: 'percentage',
          payments: [],
          subtotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          total: 0,
        });
      },

      setGlobalDiscount: (discount: number) => {
        const totals = getTotals({ ...get(), globalDiscount: discount });
        set({ globalDiscount: discount, ...totals });
      },

      setGlobalDiscountType: (type: 'percentage' | 'fixed') => {
        const totals = getTotals({ ...get(), globalDiscountType: type });
        set({ globalDiscountType: type, ...totals });
      },

      setTaxRate: (rate: number) => {
        const totals = getTotals({ ...get(), taxRate: rate });
        set({ taxRate: rate, ...totals });
      },

      setTaxType: (type: 'percentage' | 'fixed') => {
        const totals = getTotals({ ...get(), taxType: type });
        set({ taxType: type, ...totals });
      },

      setSelectedCustomer: (customer: Customer | null) => {
        set({ selectedCustomer: customer });
      },

      holdTransaction: () => {
        const { items, selectedCustomer, heldTransactions, clearCart } = get();
        if (items.length === 0) return;
        
        const held: HeldTransaction = {
          id: uuid(),
          items: [...items],
          customer: selectedCustomer,
          createdAt: new Date(),
        };
        
        set({ heldTransactions: [...heldTransactions, held] });
        clearCart();
      },

      recallTransaction: (id: string) => {
        const { heldTransactions } = get();
        const held = heldTransactions.find(h => h.id === id);
        
        if (held) {
          const totals = getTotals({ ...get(), items: held.items });
          set({
            items: held.items,
            selectedCustomer: held.customer,
            heldTransactions: heldTransactions.filter(h => h.id !== id),
            ...totals
          });
        }
      },

      deleteHeldTransaction: (id: string) => {
        set({
          heldTransactions: get().heldTransactions.filter(h => h.id !== id),
        });
      },

      addPayment: (payment: Payment) => {
        set({ payments: [...get().payments, payment] });
      },

      removePayment: (index: number) => {
        set({ payments: get().payments.filter((_, i) => i !== index) });
      },

      clearPayments: () => {
        set({ payments: [] });
      },

      completeSale: async (cashierId: string, dueDate?: string) => {
        const { items, selectedCustomer, payments, clearCart, total, subtotal, discountAmount, taxAmount } = get();
        
        if (items.length === 0) return null;
        
        const authState = useAuthStore.getState();
        const { company, user } = authState;
        
        if (!company || !user) return null;
        
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const change = totalPaid > total ? totalPaid - total : 0;
        const amountDue = Math.max(0, total - totalPaid);

        if (amountDue > 0 && !selectedCustomer) return null;

        // Guard checkout against overselling in case quantities were edited manually.
        for (const item of items) {
          const product = await db.products.get(item.productId);
          if (!product || (item.quantity ?? 0) > (product.quantity ?? 0)) {
            return null;
          }
        }
        
        const primaryPayment = payments[0];
        const paymentMethod: PaymentMethod = primaryPayment?.method || 'cash';
        
        const transactionPayload = {
          transaction_number: `TXN-${Date.now()}`,
          type: 'sale',
          status: 'completed',
          customer_id: selectedCustomer?.id || null,
          customer_name: selectedCustomer?.name || null,
          items: items.map(item => ({
            product_id: item.productId,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.price,
            price: item.price,
            total: item.price * item.quantity,
            discount: item.discount,
            unit: item.unit,
            variantId: item.variantId,
            variantName: item.variantName,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            genericName: item.genericName,
            dosage: item.dosage,
            requiresPrescription: item.requiresPrescription,
            isPack: item.isPack,
          })),
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total,
          payment_method: paymentMethod,
          amount_paid: totalPaid,
          amount_due: amountDue,
          cashier_id: cashierId,
          cashier_name: user.name,
        };
        
        try {
          if (!authState.token) return null;
          const response = await completePosSale(transactionPayload, authState.token) as Record<string, unknown>;

          // Build Transaction from API response with correct change value.
          // Do NOT read from Dexie (it hardcodes change=0).
          const txn: Transaction = {
            id: response.id as string,
            companyId: (response.company_id as string) ?? company.id,
            transactionNumber: response.transaction_number as string,
            type: 'sale',
            status: (response.status as Transaction['status']) ?? 'completed',
            customerId: response.customer_id as string | undefined,
            customerName: (response.customer_name as string) ?? (selectedCustomer?.name ?? 'Walk-in Customer'),
            items: (response.items as Transaction['items']) ?? [],
            subtotal: (response.subtotal as number) ?? subtotal,
            discountAmount: (response.discount_amount as number) ?? discountAmount,
            discountPercent: 0,
            taxAmount: (response.tax_amount as number) ?? taxAmount,
            taxPercent: 0,
            total: (response.total as number) ?? total,
            paymentMethod: (response.payment_method as PaymentMethod) ?? paymentMethod,
            amountPaid: (response.amount_paid as number) ?? totalPaid,
            change,
            amountDue: (response.amount_due as number) ?? amountDue,
            cashierId: (response.cashier_id as string) ?? cashierId,
            cashierName: (response.cashier_name as string) ?? user.name,
            syncStatus: 'synced',
            createdAt: response.created_at ? new Date(response.created_at as string) : new Date(),
            updatedAt: response.updated_at ? new Date(response.updated_at as string) : new Date(),
          };

          // Immediately write transaction to Dexie so Sales/Dashboard update instantly
          await db.transactions.put(txn);

           // Immediately decrement stock quantities in Dexie
           for (const item of items) {
             const product = await db.products.get(item.productId);
             if (product) {
               const newQty = Math.max(0, (product.quantity ?? 0) - item.quantity);
               await db.products.update(item.productId, { quantity: newQty, updatedAt: new Date() });
             }
             
             // If item has batchNumber (pharmacy), decrement that batch as well
             if (item.batchNumber) {
               const batches = await db.productBatches
                 .where('productId')
                 .equals(item.productId)
                 .toArray();
               const batch = batches.find(b => b.batchNumber === item.batchNumber);
               if (batch) {
                 const newBatchQty = Math.max(0, (batch.quantity ?? 0) - item.quantity);
                 await db.productBatches.update(batch.id, { quantity: newBatchQty, updatedAt: new Date() });
               }
             }
           }

          // If credit sale, update customer debt in Dexie immediately
          if (amountDue > 0 && selectedCustomer) {
            const cust = await db.customers.get(selectedCustomer.id);
            if (cust) {
              await db.customers.update(selectedCustomer.id, {
                currentDebt: (cust.currentDebt ?? 0) + amountDue,
                updatedAt: new Date(),
              });
            }
          }

          // Background sync for full consistency (won't block receipt)
          syncTenantDataFromApi(authState.token).catch(() => {});
          clearCart();
          return txn;
        } catch (error) {
          console.error('[POS] Failed to process payment:', error);
          return null;
        }
      },

      setSelectedCategory: (categoryId: string | null) => {
        set({ selectedCategory: categoryId });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      openPaymentModal: () => set({ isPaymentModalOpen: true }),
      closePaymentModal: () => set({ isPaymentModalOpen: false }),
      openCustomerModal: () => set({ isCustomerModalOpen: true }),
      closeCustomerModal: () => set({ isCustomerModalOpen: false }),
      refreshTotals: () => {
        const totals = getTotals(get());
        set({ ...totals });
      },
    }),
    {
      name: 'pos-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        selectedCustomer: state.selectedCustomer,
        heldTransactions: state.heldTransactions,
        globalDiscount: state.globalDiscount,
        globalDiscountType: state.globalDiscountType,
        taxRate: state.taxRate,
        taxType: state.taxType,
        subtotal: state.subtotal,
        discountAmount: state.discountAmount,
        taxAmount: state.taxAmount,
        total: state.total,
      }),
    }
  )
);

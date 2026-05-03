import { db } from "@/lib/db/dexie";
import { listTenantResource } from "@/lib/api/tenant";

const toDate = (value: unknown) => (value ? new Date(value as string) : new Date());

const normalizeTransactionItems = (items: any[] = []) =>
  items.map((item) => ({
    id: item.id,
    productId: item.product_id ?? item.productId,
    productName: item.product_name ?? item.productName ?? item.name ?? "Unknown",
    sku: item.sku ?? "",
    quantity: Number(item.quantity ?? item.qty ?? 0),
    unit: item.unit ?? "piece",
    unitPrice: Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0),
    costPrice: Number(item.cost_price ?? item.costPrice ?? 0),
    discountAmount: Number(item.discount_amount ?? item.discountAmount ?? 0),
    discountPercent: Number(item.discount_percent ?? item.discountPercent ?? 0),
    taxRate: Number(item.tax_rate ?? item.taxRate ?? 0),
    taxAmount: Number(item.tax_amount ?? item.taxAmount ?? 0),
    total: Number(item.total ?? 0),
    batchNumber: item.batch_number ?? item.batchNumber,
    expiryDate: item.expiry_date ? toDate(item.expiry_date) : item.expiryDate ? toDate(item.expiryDate) : undefined,
  }));

const normalizePurchaseItems = (items: any[] = []) =>
  items.map((item) => ({
    id: item.id,
    productId: item.product_id ?? item.productId,
    productName: item.product_name ?? item.productName ?? item.name ?? "Unknown",
    sku: item.sku ?? "",
    orderedQuantity: Number(item.ordered_quantity ?? item.orderedQuantity ?? item.qty ?? 0),
    receivedQuantity: Number(item.received_quantity ?? item.receivedQuantity ?? 0),
    unit: item.unit ?? "piece",
    unitCost: Number(item.unit_cost ?? item.unitCost ?? 0),
    taxRate: Number(item.tax_rate ?? item.taxRate ?? 0),
    taxAmount: Number(item.tax_amount ?? item.taxAmount ?? 0),
    total: Number(item.total ?? 0),
    batchNumber: item.batch_number ?? item.batchNumber,
    expiryDate: item.expiry_date ? toDate(item.expiry_date) : item.expiryDate ? toDate(item.expiryDate) : undefined,
  }));

export async function syncTenantDataFromApi(token: string) {
  const [categories, products, productBatches, customers, suppliers, transactions, purchaseOrders, debts] = await Promise.all([
    listTenantResource<any>("categories", token),
    listTenantResource<any>("products", token),
    listTenantResource<any>("product_batches", token),
    listTenantResource<any>("customers", token),
    listTenantResource<any>("suppliers", token),
    listTenantResource<any>("transactions", token),
    listTenantResource<any>("purchase_orders", token),
    listTenantResource<any>("debts", token),
  ]);

  await db.transaction(
    "rw",
    db.categories,
    db.products,
    db.productBatches,
    db.customers,
    db.suppliers,
    db.transactions,
    db.purchaseOrders,
    db.debts,
    async () => {
      await Promise.all([
        db.categories.clear(),
        db.products.clear(),
        db.productBatches.clear(),
        db.customers.clear(),
        db.suppliers.clear(),
        db.transactions.clear(),
        db.purchaseOrders.clear(),
        db.debts.clear(),
      ]);

      if (categories.length) {
        await db.categories.bulkAdd(
          categories.map((c) => ({
            id: c.id,
            companyId: c.company_id,
            parentId: c.parent_id,
            name: c.name,
            description: c.description,
            sortOrder: c.sort_order ?? 0,
            isActive: c.is_active ?? true,
            createdAt: toDate(c.created_at),
            updatedAt: toDate(c.updated_at),
          }))
        );
      }

      if (products.length) {
        await db.products.bulkAdd(
          products.map((p) => ({
            id: p.id,
            companyId: p.company_id,
            categoryId: p.category_id,
            sku: p.sku,
            qrCode: p.qr_code,
            barcode: p.barcode,
            name: p.name,
            unit: p.unit ?? "piece",
            costPrice: p.cost_price ?? 0,
            sellingPrice: p.selling_price ?? 0,
            quantity: p.quantity ?? 0,
            minStock: p.min_stock ?? 0,
            taxRate: p.tax_rate ?? 0,
            allowDecimalQuantity: false,
            hasVariants: false,
            
            // Pharmacy fields
            genericName: p.generic_name,
            brandName: p.brand_name,
            dosage: p.dosage,
            form: p.form,
            requiresPrescription: p.requires_prescription ?? false,
            unitsPerPack: p.units_per_pack ?? 1,
            
            isActive: p.is_active ?? true,
            createdAt: toDate(p.created_at),
            updatedAt: toDate(p.updated_at),
          }))
        );
      }

      if (productBatches.length) {
        await db.productBatches.bulkAdd(
          productBatches.map((b) => ({
            id: b.id,
            productId: b.product_id,
            batchNumber: b.batch_number,
            expiryDate: toDate(b.expiry_date),
            quantity: b.quantity ?? 0,
            costPrice: b.cost_price,
            sellingPrice: b.selling_price,
            createdAt: toDate(b.created_at),
            updatedAt: toDate(b.updated_at),
          }))
        );
      }

      if (customers.length) {
        await db.customers.bulkAdd(
          customers.map((c) => ({
            id: c.id,
            companyId: c.company_id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            address: c.address,
            creditLimit: c.credit_limit ?? 0,
            currentDebt: c.current_debt ?? 0,
            loyaltyPoints: 0,
            isActive: c.is_active ?? true,
            createdAt: toDate(c.created_at),
            updatedAt: toDate(c.updated_at),
          }))
        );
      }

      if (suppliers.length) {
        await db.suppliers.bulkAdd(
          suppliers.map((s) => ({
            id: s.id,
            companyId: s.company_id,
            name: s.name,
            contactPerson: s.contact_person,
            phone: s.phone,
            email: s.email,
            address: s.address,
            paymentTerms: s.payment_terms,
            currentDebt: s.current_debt ?? 0,
            isActive: s.is_active ?? true,
            createdAt: toDate(s.created_at),
            updatedAt: toDate(s.updated_at),
          }))
        );
      }

      if (transactions.length) {
        await db.transactions.bulkAdd(
          transactions.map((t) => ({
            id: t.id,
            companyId: t.company_id,
            transactionNumber: t.transaction_number,
            type: t.type ?? "sale",
            status: t.status,
            customerId: t.customer_id,
            customerName: t.customer_name,
            items: normalizeTransactionItems(t.items ?? []),
            subtotal: t.subtotal ?? 0,
            discountAmount: t.discount_amount ?? 0,
            discountPercent: 0,
            taxAmount: t.tax_amount ?? 0,
            taxPercent: 0,
            total: t.total ?? 0,
            paymentMethod: t.payment_method ?? "cash",
            amountPaid: t.amount_paid ?? 0,
            change: t.change ?? 0,
            amountDue: t.amount_due ?? 0,
            cashierId: t.cashier_id,
            cashierName: t.cashier_name,
            syncStatus: "synced",
            createdAt: toDate(t.created_at),
            updatedAt: toDate(t.updated_at),
          }))
        );
      }

      if (purchaseOrders.length) {
        await db.purchaseOrders.bulkAdd(
          purchaseOrders.map((o) => ({
            id: o.id,
            companyId: o.company_id,
            orderNumber: o.order_number,
            supplierId: o.supplier_id,
            supplierName: o.supplier_name,
            status: o.status,
            items: normalizePurchaseItems(o.items ?? []),
            subtotal: o.subtotal ?? 0,
            discountAmount: o.discount_amount ?? 0,
            taxAmount: o.tax_amount ?? 0,
            shippingCost: o.shipping_cost ?? 0,
            otherCosts: o.other_costs ?? 0,
            total: o.total ?? 0,
            amountPaid: o.amount_paid ?? 0,
            amountDue: o.amount_due ?? 0,
            expectedDate: o.expected_date ? new Date(o.expected_date) : undefined,
            receivedDate: o.received_date ? new Date(o.received_date) : undefined,
            notes: o.notes,
            syncStatus: "synced",
            createdAt: toDate(o.created_at),
            updatedAt: toDate(o.updated_at),
          }))
        );
      }

      if (debts.length) {
        await db.debts.bulkAdd(
          debts.map((d) => ({
            id: d.id,
            companyId: d.company_id,
            type: d.type,
            entityType: d.entity_type,
            entityId: d.entity_id,
            entityName: d.entity_name,
            referenceType: d.reference_type,
            referenceId: d.reference_id,
            referenceNumber: d.reference_number,
            originalAmount: d.original_amount ?? 0,
            paidAmount: d.paid_amount ?? 0,
            remainingAmount: d.remaining_amount ?? 0,
            dueDate: d.due_date ? new Date(d.due_date) : undefined,
            status: d.status ?? "pending",
            payments: d.payments ?? [],
            notes: d.notes,
            syncStatus: "synced",
            createdAt: toDate(d.created_at),
            updatedAt: toDate(d.updated_at),
          }))
        );
      }
    }
  );
}

import { Transaction, Company, Customer, PurchaseOrder, Supplier } from "@/lib/types";
import { 
  InvoiceData, 
  QuotationData, 
  DeliveryNoteData, 
  PaymentSlipData,
  OrderSlipData
} from "@/lib/types/documents";
import { addDays } from "date-fns";

export function transformTransactionToInvoice(
  transaction: Transaction, 
  company: Company, 
  customer?: Customer
): InvoiceData {
  return {
    type: 'invoice',
    id: transaction.id,
    documentNumber: transaction.transactionNumber,
    date: transaction.createdAt,
    dueDate: addDays(transaction.createdAt, 15),
    company,
    customer,
    items: transaction.items.map(item => ({
      id: item.id,
      description: item.productName + (item.variantName ? ` (${item.variantName})` : ''),
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.total,
      sku: item.sku
    })),
    subtotal: transaction.subtotal,
    taxAmount: transaction.taxAmount,
    taxPercent: transaction.taxPercent,
    discountAmount: transaction.discountAmount,
    total: transaction.total,
    paymentMethod: transaction.paymentMethod,
    amountPaid: transaction.amountPaid,
    amountDue: transaction.amountDue,
    accountNumber: "ACC-" + company.id.slice(0, 8).toUpperCase(),
  };
}

export function transformTransactionToQuotation(
  transaction: Transaction, 
  company: Company, 
  customer?: Customer
): QuotationData {
  return {
    type: 'quotation',
    id: transaction.id,
    documentNumber: "QT-" + transaction.transactionNumber,
    date: transaction.createdAt,
    validUntil: addDays(transaction.createdAt, 30),
    company,
    customer,
    items: transaction.items.map(item => ({
      id: item.id,
      description: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.total,
      sku: item.sku
    })),
    subtotal: transaction.subtotal,
    taxAmount: transaction.taxAmount,
    taxPercent: transaction.taxPercent,
    discountAmount: transaction.discountAmount,
    total: transaction.total,
  };
}

export function transformTransactionToDeliveryNote(
  transaction: Transaction, 
  company: Company, 
  customer?: Customer
): DeliveryNoteData {
  return {
    type: 'delivery_note',
    id: transaction.id,
    documentNumber: "DN-" + transaction.transactionNumber,
    date: transaction.createdAt,
    company,
    customer,
    items: transaction.items.map(item => ({
      id: item.id,
      description: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.total,
      sku: item.sku
    })),
    subtotal: transaction.subtotal,
    taxAmount: transaction.taxAmount,
    taxPercent: transaction.taxPercent,
    discountAmount: transaction.discountAmount,
    total: transaction.total,
    deliveryStatus: 'complete',
  };
}

export function transformTransactionToPaymentSlip(
  transaction: Transaction, 
  company: Company, 
  customer?: Customer
): PaymentSlipData {
  return {
    id: transaction.id,
    receiptNumber: "REC-" + transaction.transactionNumber,
    date: transaction.createdAt,
    company,
    customer: customer || { 
      id: 'walk-in', 
      name: 'Walk-in Customer', 
      companyId: company.id, 
      isActive: true, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      creditLimit: 0,
      currentDebt: 0,
      loyaltyPoints: 0
    },
    amount: transaction.amountPaid,
    paymentMethod: transaction.paymentMethod,
    referenceNumber: transaction.id.slice(0, 12).toUpperCase(),
    notes: transaction.notes,
  };
}

export function transformTransactionToOrderSlip(
  transaction: Transaction,
  company: Company,
  customer?: Customer
): OrderSlipData {
  return {
    type: 'order_slip',
    id: transaction.id,
    documentNumber: `OS-${transaction.transactionNumber}`,
    date: transaction.createdAt,
    company,
    customer,
    items: transaction.items.map(item => ({
      id: item.id,
      description: item.productName + (item.variantName ? ` (${item.variantName})` : ''),
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.total,
      sku: item.sku
    })),
    subtotal: transaction.subtotal,
    taxAmount: transaction.taxAmount,
    taxPercent: transaction.taxPercent,
    discountAmount: transaction.discountAmount,
    total: transaction.total,
    notes: transaction.notes,
    orderType: 'pos_sale',
    servedBy: transaction.cashierName,
  };
}

function mapSupplierAsCustomer(supplier: Supplier | undefined, company: Company): Customer {
  return {
    id: supplier?.id || 'unknown-supplier',
    companyId: company.id,
    name: supplier?.name || 'Unknown Supplier',
    phone: supplier?.phone,
    email: supplier?.email,
    address: supplier?.address,
    creditLimit: 0,
    currentDebt: supplier?.currentDebt || 0,
    loyaltyPoints: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function transformPurchaseOrderToInvoice(
  order: PurchaseOrder,
  company: Company,
  supplier?: Supplier
): InvoiceData {
  const linkedSupplier = mapSupplierAsCustomer(supplier, company);
  return {
    type: 'invoice',
    id: order.id,
    documentNumber: order.orderNumber,
    date: order.createdAt,
    dueDate: order.expectedDate,
    company,
    customer: linkedSupplier,
    items: order.items.map(item => ({
      id: item.id,
      description: item.productName,
      quantity: item.orderedQuantity,
      unit: item.unit,
      unitPrice: item.unitCost,
      total: item.total,
      sku: item.sku
    })),
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    taxPercent: order.subtotal > 0 ? Number(((order.taxAmount / order.subtotal) * 100).toFixed(2)) : 0,
    discountAmount: order.discountAmount,
    total: order.total,
    paymentMethod: order.amountDue > 0 ? 'credit' : 'cash',
    amountPaid: order.amountPaid,
    amountDue: order.amountDue,
    accountNumber: "SUP-" + company.id.slice(0, 8).toUpperCase(),
    notes: order.notes,
    terms: supplier?.paymentTerms,
  };
}

export function transformPurchaseOrderToQuotation(
  order: PurchaseOrder,
  company: Company,
  supplier?: Supplier
): QuotationData {
  const linkedSupplier = mapSupplierAsCustomer(supplier, company);
  return {
    type: 'quotation',
    id: order.id,
    documentNumber: `Q-${order.orderNumber}`,
    date: order.createdAt,
    validUntil: order.expectedDate || addDays(order.createdAt, 30),
    company,
    customer: linkedSupplier,
    items: order.items.map(item => ({
      id: item.id,
      description: item.productName,
      quantity: item.orderedQuantity,
      unit: item.unit,
      unitPrice: item.unitCost,
      total: item.total,
      sku: item.sku
    })),
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    taxPercent: order.subtotal > 0 ? Number(((order.taxAmount / order.subtotal) * 100).toFixed(2)) : 0,
    discountAmount: order.discountAmount,
    total: order.total,
    notes: order.notes,
  };
}

export function transformPurchaseOrderToDeliveryNote(
  order: PurchaseOrder,
  company: Company,
  supplier?: Supplier
): DeliveryNoteData {
  const linkedSupplier = mapSupplierAsCustomer(supplier, company);
  const totalReceived = order.items.reduce((sum, i) => sum + i.receivedQuantity, 0);
  const totalOrdered = order.items.reduce((sum, i) => sum + i.orderedQuantity, 0);
  const deliveryStatus = totalReceived >= totalOrdered && totalOrdered > 0 ? 'complete' : 'partial';

  return {
    type: 'delivery_note',
    id: order.id,
    documentNumber: `DN-${order.orderNumber}`,
    date: order.receivedDate || order.updatedAt || order.createdAt,
    company,
    customer: linkedSupplier,
    items: order.items.map(item => ({
      id: item.id,
      description: item.productName,
      quantity: item.receivedQuantity > 0 ? item.receivedQuantity : item.orderedQuantity,
      unit: item.unit,
      unitPrice: item.unitCost,
      total: item.unitCost * (item.receivedQuantity > 0 ? item.receivedQuantity : item.orderedQuantity),
      sku: item.sku
    })),
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    taxPercent: order.subtotal > 0 ? Number(((order.taxAmount / order.subtotal) * 100).toFixed(2)) : 0,
    discountAmount: order.discountAmount,
    total: order.total,
    notes: order.notes,
    deliveryStatus,
  };
}

export function transformPurchaseOrderToPaymentSlip(
  order: PurchaseOrder,
  company: Company,
  supplier?: Supplier
): PaymentSlipData {
  const linkedSupplier = mapSupplierAsCustomer(supplier, company);
  return {
    id: order.id,
    receiptNumber: `PAY-${order.orderNumber}`,
    date: order.updatedAt || order.createdAt,
    company,
    customer: linkedSupplier,
    amount: order.amountPaid,
    paymentMethod: order.amountDue > 0 ? 'credit' : 'cash',
    referenceNumber: order.id.slice(0, 12).toUpperCase(),
    notes: order.notes || supplier?.paymentTerms,
  };
}

export function transformPurchaseOrderToOrderSlip(
  order: PurchaseOrder,
  company: Company,
  supplier?: Supplier
): OrderSlipData {
  const linkedSupplier = mapSupplierAsCustomer(supplier, company);
  return {
    type: 'order_slip',
    id: order.id,
    documentNumber: `OS-${order.orderNumber}`,
    date: order.createdAt,
    company,
    customer: linkedSupplier,
    items: order.items.map(item => ({
      id: item.id,
      description: item.productName,
      quantity: item.orderedQuantity,
      unit: item.unit,
      unitPrice: item.unitCost,
      total: item.total,
      sku: item.sku
    })),
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    taxPercent: order.subtotal > 0 ? Number(((order.taxAmount / order.subtotal) * 100).toFixed(2)) : 0,
    discountAmount: order.discountAmount,
    total: order.total,
    notes: order.notes,
    orderType: 'pos_sale',
    servedBy: company.name,
  };
}

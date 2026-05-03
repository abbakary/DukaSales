import { Company, Customer, TransactionItem, PaymentMethod } from './index';

export type DocumentType = 'invoice' | 'quotation' | 'delivery_note' | 'payment_slip' | 'order_slip';

export interface BaseDocumentData {
  id: string;
  documentNumber: string;
  date: Date;
  company: Company;
  customer?: Customer;
  items: DocumentItem[];
  subtotal: number;
  taxAmount: number;
  taxPercent: number;
  discountAmount: number;
  total: number;
  notes?: string;
  terms?: string;
}

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
  sku?: string;
}

export interface InvoiceData extends BaseDocumentData {
  type: 'invoice';
  paymentMethod?: PaymentMethod;
  amountPaid: number;
  amountDue: number;
  dueDate?: Date;
  accountNumber?: string;
}

export interface QuotationData extends BaseDocumentData {
  type: 'quotation';
  validUntil: Date;
}

export interface DeliveryNoteData extends BaseDocumentData {
  type: 'delivery_note';
  deliveryStatus: 'partial' | 'complete';
  recipientSignature?: string;
  deliveryPersonSignature?: string;
}

export interface PaymentSlipData {
  id: string;
  receiptNumber: string;
  date: Date;
  company: Company;
  customer: Customer;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface OrderSlipData extends BaseDocumentData {
  type: 'order_slip';
  orderType: 'pos_sale';
  servedBy?: string;
}

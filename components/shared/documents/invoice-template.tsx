"use client";

import React from 'react';
import { InvoiceData } from '@/lib/types/documents';
import { format } from 'date-fns';
import { BaseDocument } from './base-document';
import { getFullImageUrl } from '@/lib/utils';

interface InvoiceTemplateProps {
  data: InvoiceData;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ data }, ref) => {
    const { company, customer, items, total, subtotal, taxAmount, discountAmount, documentNumber, date } = data;
    const discountPercent = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;

    return (
      <BaseDocument ref={ref}>
        {/* Design based on Image 1 */}
        <div className="relative">
          {/* Header Accent */}
          <div className="absolute top-0 right-0 w-64 h-32 bg-[#005d9a] transform skew-x-[-20deg] origin-top-right -mr-16"></div>
          <div className="absolute top-0 right-0 w-48 h-24 bg-[#a0c43c] transform skew-x-[-20deg] origin-top-right -mr-24 mt-4"></div>

          {/* Company Header */}
          <div className="p-12 flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              {company.logo ? (
                <img src={getFullImageUrl(company.logo)} alt={company.name} className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 bg-[#005d9a] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {company.name[0]}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[#005d9a] uppercase tracking-tight">{company.name}</h1>
                <p className="text-xs text-slate-500 font-medium">
                  {company.physical_address || company.address}
                </p>
                {/* Enhanced company details - conditional display */}
                {(company.vrn_no || company.tin_no) && (
                  <p className="text-xs text-slate-500 font-medium">
                    {company.vrn_no && <span>VRN: {company.vrn_no}</span>}
                    {company.vrn_no && company.tin_no && <span> | </span>}
                    {company.tin_no && <span>TIN: {company.tin_no}</span>}
                  </p>
                )}
                {company.contact_person && (
                  <p className="text-xs text-slate-500 font-medium">
                    Contact: {company.contact_person} {company.contact_person_title && `(${company.contact_person_title})`}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right text-xs space-y-1 pt-2 mr-12 text-slate-600">
              <p>Phone: {company.phone}</p>
              <p>Email: {company.email}</p>
              {company.alternative_phone && <p>Alt Phone: {company.alternative_phone}</p>}
              {company.whatsapp && <p>WhatsApp: {company.whatsapp}</p>}
              {company.website && <p>Website: {company.website}</p>}
              {/* Additional address details */}
              {company.postal_address && company.postal_address !== company.address && (
                <p>Postal: {company.postal_address}</p>
              )}
              {(company.city || company.region || company.country) && (
                <p>
                  {[company.city, company.region, company.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="px-12 py-8 flex justify-between items-end">
            <div>
              <p className="text-[#005d9a] font-bold text-xs uppercase mb-2">Invoice To</p>
              <h2 className="text-lg font-bold text-slate-800">
                {customer?.business_name || customer?.name || 'Walk-in Customer'}
              </h2>
              {/* Enhanced customer details - conditional display */}
              {customer?.business_name && customer?.name && customer?.business_name !== customer?.name && (
                <p className="text-xs text-slate-500">Attn: {customer.name}</p>
              )}
              {customer?.contact_person && (
                <p className="text-xs text-slate-500">Contact: {customer.contact_person} {customer.contact_person_title && `(${customer.contact_person_title})`}</p>
              )}
              <p className="text-xs text-slate-500">
                {customer?.physical_address || customer?.address || 'N/A'}
              </p>
              {customer?.shipping_address && customer?.shipping_address !== customer?.address && (
                <p className="text-xs text-slate-500">Shipping: {customer.shipping_address}</p>
              )}
              <p className="text-xs text-slate-500">Ph: {customer?.phone || 'N/A'}</p>
              {customer?.alternative_phone && (
                <p className="text-xs text-slate-500">Alt Phone: {customer.alternative_phone}</p>
              )}
              <p className="text-xs text-slate-500">Em: {customer?.email || 'N/A'}</p>
              {customer?.customer_number && (
                <p className="text-xs text-slate-500">Customer No: {customer.customer_number}</p>
              )}
              {(customer?.vrn_no || customer?.tax_id) && (
                <p className="text-xs text-slate-500">
                  {customer.vrn_no && <span>VRN: {customer.vrn_no}</span>}
                  {customer.vrn_no && (customer.tax_id || customer.tin_no) && <span> | </span>}
                  {(customer.tax_id || customer.tin_no) && <span>TIN: {customer.tax_id || customer.tin_no}</span>}
                </p>
              )}
              {customer?.website && (
                <p className="text-xs text-slate-500">Website: {customer.website}</p>
              )}
            </div>

            <div className="text-right">
              <h1 className="text-6xl font-black text-slate-200 uppercase tracking-tighter mb-4">INVOICE</h1>
              <div className="flex flex-col items-end gap-1 text-xs">
                <div className="flex gap-4">
                  <span className="font-bold text-slate-400">Invoice No :</span>
                  <span className="font-bold text-slate-700">{documentNumber}</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-bold text-slate-400">Account No :</span>
                  <span className="font-bold text-slate-700">{data.accountNumber || 'N/A'}</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-bold text-slate-400">Invoice Date :</span>
                  <span className="font-bold text-slate-700">{format(date, 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="mt-8 px-12">
            <div className="grid grid-cols-12 bg-slate-100 rounded-sm overflow-hidden border-2 border-[#005d9a]">
              <div className="col-span-6 bg-[#005d9a] text-white py-3 px-4 text-xs font-black uppercase tracking-widest">Item Description</div>
              <div className="col-span-2 bg-[#005d9a] text-white py-3 px-4 text-xs font-black uppercase tracking-widest text-center border-l border-white/20">Unit Price</div>
              <div className="col-span-2 bg-[#005d9a] text-white py-3 px-4 text-xs font-black uppercase tracking-widest text-center border-l border-white/20">Quantity</div>
              <div className="col-span-2 bg-[#005d9a] text-white py-3 px-4 text-xs font-black uppercase tracking-widest text-center border-l border-white/20">Amount</div>
            </div>

            {/* Table Rows */}
            <div className="border-2 border-t-0 border-[#005d9a] divide-y divide-slate-200">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 hover:bg-slate-50 transition-colors divide-x divide-slate-100">
                  <div className="col-span-6 py-4 px-4 flex items-start gap-3">
                    <span className="text-[10px] font-black text-slate-300 mt-0.5">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase leading-tight">{item.description}</p>
                      {item.sku && <p className="text-[10px] font-mono font-bold text-indigo-600 mt-1 uppercase tracking-tighter">SKU: {item.sku}</p>}
                    </div>
                  </div>
                  <div className="col-span-2 py-4 px-4 text-sm text-slate-700 text-center flex items-center justify-center font-bold">
                    {company.currencySymbol}{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="col-span-2 py-4 px-4 text-sm text-slate-700 text-center flex items-center justify-center">
                    <span className="bg-slate-100 px-3 py-1 rounded-full font-black text-[11px]">
                      {item.quantity} {item.unit || 'pcs'}
                    </span>
                  </div>
                  <div className="col-span-2 py-4 px-4 text-sm text-slate-900 text-right flex items-center justify-end font-black pr-6">
                    {company.currencySymbol}{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {/* Fill space with empty rows if needed for consistent PDF look */}
              {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
                <div key={`empty-${i}`} className="grid grid-cols-12 h-12 divide-x divide-slate-50 opacity-20">
                  <div className="col-span-6"></div>
                  <div className="col-span-2"></div>
                  <div className="col-span-2"></div>
                  <div className="col-span-2"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-8 px-12 grid grid-cols-12">
            <div className="col-span-6 space-y-8">
              <div>
                <p className="text-sm font-bold text-slate-800 uppercase mb-2">Total Due</p>
                <p className="text-3xl font-black text-[#a0c43c]">
                  {company.currency} {company.currencySymbol}{total.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-[#005d9a] text-xs font-bold mb-1">Thank you for your business !</p>
                <div className="flex gap-2">
                  <div className="w-1 bg-slate-400"></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase">Terms & condition :</p>
                    <p className="text-[9px] text-slate-500 leading-tight max-w-xs">
                      {data.terms || "Please pay within 15 days of receiving this invoice. Late payments are subject to a 5% monthly fee."}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-800 uppercase mb-1">Payment Methods</p>
                <p className="text-[9px] text-slate-500">
                  {company.name} | {company.email}
                  <br />
                  Payment : {data.paymentMethod || 'Credit Card / Cash'}
                </p>
              </div>
            </div>

            <div className="col-span-6 flex flex-col items-end">
              <div className="w-full max-w-[240px] space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Sub Total</span>
                  <span className="text-slate-400 font-bold">:</span>
                  <span className="text-slate-700 font-bold">{company.currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Tax. Vat {data.taxPercent}%</span>
                  <span className="text-slate-400 font-bold">:</span>
                  <span className="text-slate-700 font-bold">{company.currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Discount {discountPercent.toFixed(0)}%</span>
                  <span className="text-slate-400 font-bold">:</span>
                  <span className="text-slate-700 font-bold">{company.currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full bg-[#005d9a] mt-4 p-4 flex justify-between items-center rounded-sm">
                <span className="text-white text-sm font-black uppercase tracking-widest">Grand Total</span>
                <span className="text-white text-xs font-bold">:</span>
                <span className="text-[#a0c43c] text-xl font-black">{company.currencySymbol}{total.toFixed(2)}</span>
              </div>

              {/* Signature Area */}
              <div className="mt-12 text-center mr-8">
                <p className="text-sm italic text-slate-400 font-serif mb-2">{company.name}</p>
                <div className="w-48 h-px bg-slate-800 mb-1"></div>
                <p className="text-[10px] font-bold text-slate-800 uppercase">{company.name} Representative</p>
                <p className="text-[8px] text-slate-400 uppercase">Authorized Signatory</p>
              </div>
            </div>
          </div>

          {/* Bottom Accent */}
          <div className="absolute bottom-0 left-0 w-full h-8 overflow-hidden flex">
            <div className="h-full w-1/4 bg-[#005d9a] transform skew-x-[45deg] -ml-4"></div>
            <div className="h-full w-1/4 bg-[#a0c43c] transform skew-x-[45deg] -ml-8"></div>
            <div className="h-full w-1/2 bg-slate-800 transform skew-x-[45deg] -ml-8"></div>
          </div>
        </div>
      </BaseDocument>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';

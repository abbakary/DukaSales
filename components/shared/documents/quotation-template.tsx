"use client";

import React from 'react';
import { QuotationData } from '@/lib/types/documents';
import { format } from 'date-fns';
import { BaseDocument } from './base-document';
import { getFullImageUrl } from '@/lib/utils';

interface QuotationTemplateProps {
  data: QuotationData;
}

export const QuotationTemplate = React.forwardRef<HTMLDivElement, QuotationTemplateProps>(
  ({ data }, ref) => {
    const { company, customer, items, total, subtotal, taxAmount, documentNumber, date, validUntil } = data;

    const themeColor = "#0095da";

    return (
      <BaseDocument ref={ref}>
        {/* Design based on Image 2 */}
        <div className="p-8">
          <div className="flex justify-between items-start">
            <div className="flex flex-col items-center">
              {company.logo ? (
                <img src={getFullImageUrl(company.logo)} alt={company.name} className="w-24 h-24 object-contain" />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center">
                  <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 5L15 25V75L50 95L85 75V25L50 5Z" fill={themeColor} />
                    <path d="M50 20L25 35V65L50 80L75 65V35L50 20Z" fill="white" />
                  </svg>
                </div>
              )}
              <h2 className="text-xl font-bold text-[#0095da] mt-2 uppercase">{company.name}</h2>
              {/* Enhanced company details - conditional display */}
              {(company.vrn_no || company.tin_no) && (
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {company.vrn_no && <span>VRN: {company.vrn_no}</span>}
                  {company.vrn_no && company.tin_no && <span> | </span>}
                  {company.tin_no && <span>TIN: {company.tin_no}</span>}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {company.physical_address || company.address}
              </p>
            </div>

            <div className="w-full max-w-[400px]">
              <div className="bg-[#0095da] text-white py-2 px-8 text-right font-black text-3xl tracking-widest rounded-l-full -mr-8">
                QUOTATION
              </div>
              
              <div className="mt-4 flex flex-col items-end gap-2 pr-4 text-sm font-medium text-slate-600">
                <div className="flex w-full justify-end border-b border-slate-200 pb-1">
                  <span className="mr-4">No.</span>
                  <span className="text-slate-800">{documentNumber}</span>
                </div>
                <div className="flex w-full justify-end border-b border-slate-200 pb-1">
                  <span className="mr-4">Date:</span>
                  <span className="text-slate-800">{format(date, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex w-full justify-end border-b border-slate-200 pb-1">
                  <span className="mr-4">Valid for:</span>
                  <span className="text-slate-800">{format(validUntil, 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-[#0095da] text-white px-6 py-2 font-bold text-lg inline-block rounded-tr-xl">
              Client Details:
            </div>
            <div className="border-2 border-[#0095da] p-6 rounded-b-xl rounded-tr-xl min-h-[120px]">
              <h3 className="text-lg font-bold text-slate-800 uppercase">
                {customer?.business_name || customer?.name || 'Valued Customer'}
              </h3>
              {/* Enhanced customer details - conditional display */}
              {customer?.business_name && customer?.name && customer?.business_name !== customer?.name && (
                <p className="text-sm text-slate-600 mt-1">Attn: {customer.name}</p>
              )}
              {customer?.contact_person && (
                <p className="text-sm text-slate-600 mt-1">
                  Contact: {customer.contact_person} {customer.contact_person_title && `(${customer.contact_person_title})`}
                </p>
              )}
              <p className="text-sm text-slate-600 mt-2">
                {customer?.physical_address || customer?.address || 'N/A'}
              </p>
              {customer?.shipping_address && customer?.shipping_address !== customer?.address && (
                <p className="text-sm text-slate-600">Shipping: {customer.shipping_address}</p>
              )}
              <p className="text-sm text-slate-600">Phone: {customer?.phone || 'N/A'}</p>
              {customer?.alternative_phone && (
                <p className="text-sm text-slate-600">Alt Phone: {customer.alternative_phone}</p>
              )}
              <p className="text-sm text-slate-600">Email: {customer?.email || 'N/A'}</p>
              {customer?.customer_number && (
                <p className="text-sm text-slate-600">Customer No: {customer.customer_number}</p>
              )}
              {(customer?.vrn_no || customer?.tax_id || customer?.taxId) && (
                <p className="text-sm text-slate-600">
                  {customer.vrn_no && <span>VRN: {customer.vrn_no}</span>}
                  {customer.vrn_no && (customer.tax_id || customer.taxId) && <span> | </span>}
                  {(customer.tax_id || customer.taxId) && <span>TIN: {customer.tax_id || customer.taxId}</span>}
                </p>
              )}
              {customer?.website && (
                <p className="text-sm text-slate-600">Website: {customer.website}</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <table className="w-full border-collapse border-2 border-[#0095da]">
              <thead>
                <tr className="bg-[#0095da]/5">
                  <th className="border-2 border-[#0095da] text-[#0095da] py-3 px-2 text-[10px] uppercase font-black w-12">No.</th>
                  <th className="border-2 border-[#0095da] text-[#0095da] py-3 px-4 text-[10px] uppercase font-black text-left tracking-widest">Item Description</th>
                  <th className="border-2 border-[#0095da] text-[#0095da] py-3 px-2 text-[10px] uppercase font-black w-24">Quantity</th>
                  <th className="border-2 border-[#0095da] text-[#0095da] py-3 px-4 text-[10px] uppercase font-black w-28">Unit Price</th>
                  <th className="border-2 border-[#0095da] text-[#0095da] py-3 px-4 text-[10px] uppercase font-black w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="border-2 border-[#0095da] py-3 px-2 text-xs text-center text-slate-400 font-black">{String(index + 1).padStart(2, '0')}</td>
                    <td className="border-2 border-[#0095da] py-3 px-4">
                      <p className="text-sm font-black text-slate-800 uppercase leading-tight">{item.description}</p>
                      {item.sku && <p className="text-[10px] font-mono font-bold text-indigo-600 mt-1 uppercase tracking-tighter">SKU: {item.sku}</p>}
                    </td>
                    <td className="border-2 border-[#0095da] py-3 px-2 text-sm text-center text-slate-700 font-bold bg-slate-50/50">
                      {item.quantity} {item.unit || 'pcs'}
                    </td>
                    <td className="border-2 border-[#0095da] py-3 px-4 text-sm text-right text-slate-600 font-bold">
                      {company.currencySymbol}{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border-2 border-[#0095da] py-3 px-4 text-sm text-right text-slate-900 font-black">
                      {company.currencySymbol}{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {/* Empty rows to fill space like in template */}
                {items.length < 8 && Array.from({ length: 8 - items.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-10 opacity-10">
                    <td className="border-2 border-[#0095da]"></td>
                    <td className="border-2 border-[#0095da]"></td>
                    <td className="border-2 border-[#0095da]"></td>
                    <td className="border-2 border-[#0095da]"></td>
                    <td className="border-2 border-[#0095da]"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-between">
            <div className="w-1/2">
              <div className="bg-[#0095da] text-white px-4 py-1 font-bold text-sm uppercase inline-block">
                Payment Details:
              </div>
              <div className="border-2 border-[#0095da] p-4 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-[#0095da]">{company.name}</p>
                <p>Payment method: {data.notes || "Bank / Card / Mobile"}</p>
                <p>Contact: {company.phone || "-"}</p>
                <p>Email: {company.email || "-"}</p>
              </div>
            </div>

            <div className="w-1/3">
              <div className="flex justify-between items-center py-1 border-b-2 border-[#0095da]">
                <span className="text-xs font-black text-[#0095da] uppercase">Sub Total:</span>
                <span className="text-sm font-bold text-slate-700">{company.currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b-2 border-[#0095da]">
                <span className="text-xs font-black text-[#0095da] uppercase">Tax ({data.taxPercent}%):</span>
                <span className="text-sm font-bold text-slate-700">{company.currencySymbol}{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-slate-50 mt-1">
                <span className="text-sm font-black text-[#0095da] uppercase ml-2">Totals:</span>
                <span className="text-lg font-black text-slate-900 mr-2">{company.currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-12 left-0 w-full px-8">
            <div className="border-t-4 border-[#0095da] pt-4 flex justify-between items-center">
              <div className="flex gap-4 text-[10px] font-bold text-[#0095da]">
                <span>Phone: {company.phone}</span>
                <span>Email: {company.email}</span>
                <span>Address: {company.address || "-"}</span>
              </div>
              <p className="text-sm font-black text-[#0095da] uppercase tracking-wider">Thank you for your Business!</p>
            </div>
          </div>
        </div>
      </BaseDocument>
    );
  }
);

QuotationTemplate.displayName = 'QuotationTemplate';

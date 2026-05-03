"use client";

import React from 'react';
import { DeliveryNoteData } from '@/lib/types/documents';
import { format } from 'date-fns';
import { BaseDocument } from './base-document';
import { Truck } from 'lucide-react';
import { getFullImageUrl } from '@/lib/utils';

interface DeliveryNoteTemplateProps {
  data: DeliveryNoteData;
}

export const DeliveryNoteTemplate = React.forwardRef<HTMLDivElement, DeliveryNoteTemplateProps>(
  ({ data }, ref) => {
    const { company, customer, items, total, subtotal, taxAmount, discountAmount, documentNumber, date } = data;

    const accentColor = "#d4c5a1"; // Beige/Gold from image

    return (
      <BaseDocument ref={ref}>
        {/* Design based on Image 3 */}
        <div className="p-12 relative h-full">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <div className="w-32 h-32 flex items-center justify-center bg-slate-50 rounded-full border-4 border-[#d4c5a1] relative overflow-hidden">
                <Truck className="w-16 h-16 text-[#d4c5a1]" />
                <div className="absolute bottom-4 right-4 bg-orange-400 w-8 h-2 rounded-full transform rotate-12"></div>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-4">Delivery Receipt</h1>
              <div className="flex gap-4 text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">
                <div className="flex flex-col">
                  <span>Date</span>
                  <div className="border-b border-dotted border-slate-400 w-32 mt-1 py-1">{format(date, 'MMM dd, yyyy')}</div>
                </div>
                <div className="flex flex-col">
                  <span>Receipt #</span>
                  <div className="border-b border-dotted border-slate-400 w-32 mt-1 py-1">{documentNumber}</div>
                </div>
              </div>
            </div>

            <div className="text-right text-sm space-y-1">
              {company.logo && (
                <div className="flex justify-end mb-2">
                  <img src={getFullImageUrl(company.logo)} alt={company.name} className="w-14 h-14 object-contain" />
                </div>
              )}
              <p className="font-black text-slate-800 uppercase text-lg">{company.name}</p>
              <p className="text-slate-500 font-medium whitespace-pre-line">{company.address}</p>
              <p className="text-slate-500 font-medium">{company.email || "-"}</p>
              <p className="text-slate-500 font-medium">{company.phone || "-"}</p>
            </div>
          </div>

          <div className="mt-12">
            <div className="bg-[#e9e2d1] text-slate-800 py-2 px-4 text-center font-black text-xl uppercase tracking-widest border-2 border-slate-800">
              Deliver To
            </div>
            <div className="border-2 border-t-0 border-slate-800 grid grid-cols-12 divide-x-2 divide-slate-800">
              <div className="col-span-3 py-2 px-4 text-xs font-black uppercase text-slate-800 bg-slate-50 flex items-center">Name</div>
              <div className="col-span-9 py-2 px-4 text-sm font-bold text-slate-700">{customer?.name || 'Walk-in Customer'}</div>
            </div>
            <div className="border-2 border-t-0 border-slate-800 grid grid-cols-12 divide-x-2 divide-slate-800">
              <div className="col-span-3 py-2 px-4 text-xs font-black uppercase text-slate-800 bg-slate-50 flex items-center">Address</div>
              <div className="col-span-9 py-2 px-4 text-sm text-slate-600">{customer?.address || 'N/A'}</div>
            </div>
            <div className="border-2 border-t-0 border-slate-800 grid grid-cols-12 divide-x-2 divide-slate-800">
              <div className="col-span-3 py-2 px-4 text-xs font-black uppercase text-slate-800 bg-slate-50 flex items-center">Phone</div>
              <div className="col-span-9 py-2 px-4 text-sm text-slate-600">{customer?.phone || 'N/A'}</div>
            </div>
          </div>

          <div className="mt-8 flex gap-12">
             <div className="flex items-center gap-2">
                <div className={`w-4 h-4 border-2 border-slate-800 ${data.deliveryStatus === 'partial' ? 'bg-slate-800' : ''}`}></div>
                <span className="text-xs font-bold uppercase text-slate-700">Partial Delivery</span>
             </div>
             <div className="flex items-center gap-2">
                <div className={`w-4 h-4 border-2 border-slate-800 ${data.deliveryStatus === 'complete' ? 'bg-slate-800' : ''}`}></div>
                <span className="text-xs font-bold uppercase text-slate-700">Complete Delivery</span>
             </div>
          </div>

          <div className="mt-8">
            <div className="grid grid-cols-12 border-2 border-slate-800 divide-x-2 divide-slate-800">
              <div className="col-span-1 bg-[#e9e2d1] py-2 px-4 text-center font-black text-xs uppercase text-slate-800">No.</div>
              <div className="col-span-8 bg-[#e9e2d1] py-2 px-4 text-center font-black text-xs uppercase text-slate-800 tracking-widest">Item Description</div>
              <div className="col-span-3 bg-[#e9e2d1] py-2 px-4 text-center font-black text-xs uppercase text-slate-800 tracking-widest">Quantity</div>
            </div>
            <div className="border-2 border-t-0 border-slate-800 divide-y-2 divide-slate-800">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 divide-x-2 divide-slate-800 hover:bg-slate-50">
                  <div className="col-span-1 py-3 px-4 text-xs font-black text-slate-400 text-center flex items-center justify-center">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="col-span-8 py-3 px-4">
                    <p className="text-sm font-black text-slate-800 uppercase leading-tight">{item.description}</p>
                    {item.sku && <p className="text-[10px] font-mono font-bold text-indigo-600 mt-1 uppercase tracking-tighter">SKU: {item.sku}</p>}
                  </div>
                  <div className="col-span-3 py-3 px-4 text-sm font-black text-center text-slate-800 flex items-center justify-center bg-slate-50/50">
                    <span className="bg-white border-2 border-slate-200 px-4 py-1 rounded-lg">
                      {item.quantity} {item.unit || 'pcs'}
                    </span>
                  </div>
                </div>
              ))}
              {/* Padding rows */}
              {items.length < 8 && Array.from({ length: 8 - items.length }).map((_, i) => (
                <div key={`empty-${i}`} className="grid grid-cols-12 divide-x-2 divide-slate-800 h-12 opacity-10">
                  <div className="col-span-1"></div>
                  <div className="col-span-8"></div>
                  <div className="col-span-3"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-12 gap-8">
            <div className="col-span-6 space-y-4">
              <div>
                <p className="text-sm font-black uppercase text-slate-800">Payment Method :</p>
                <div className="border-b-2 border-slate-800 w-full mt-2 h-6"></div>
              </div>
              <div>
                <p className="text-sm font-black uppercase text-slate-800">Comments :</p>
                <div className="border-b-2 border-slate-800 w-full mt-2 h-6"></div>
                <div className="border-b-2 border-slate-800 w-full mt-2 h-6"></div>
                <div className="border-b-2 border-slate-800 w-full mt-2 h-6"></div>
              </div>
            </div>

            <div className="col-span-6">
              <div className="border-2 border-slate-800 divide-y-2 divide-slate-800">
                <div className="flex justify-between p-1 bg-slate-50">
                  <span className="text-[10px] font-black uppercase ml-2">Subtotal</span>
                  <span className="text-xs font-bold mr-2">{company.currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-1">
                  <span className="text-[10px] font-black uppercase ml-2">Discount</span>
                  <span className="text-xs font-bold mr-2">{company.currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-1">
                  <span className="text-[10px] font-black uppercase ml-2">TAX / VAT</span>
                  <span className="text-xs font-bold mr-2">{company.currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-1 bg-[#e9e2d1]">
                  <span className="text-[10px] font-black uppercase ml-2">Total Amount Due</span>
                  <span className="text-sm font-black mr-2">{company.currencySymbol}{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-1">
                  <span className="text-[10px] font-black uppercase ml-2">Amount Paid</span>
                  <span className="text-xs font-bold mr-2">{company.currencySymbol}0.00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-12 left-0 w-full px-12 flex justify-between gap-12">
            <div className="w-1/2">
              <p className="text-xs font-black uppercase text-slate-800 mb-8">Recipient Signature</p>
              <div className="border-b-2 border-slate-800 w-full"></div>
            </div>
            <div className="w-1/2">
              <p className="text-xs font-black uppercase text-slate-800 mb-8 text-right">Delivery Person Signature</p>
              <div className="border-b-2 border-slate-800 w-full"></div>
            </div>
          </div>

          <div className="absolute bottom-0 right-0 left-0 bg-[#005d9a] h-12 flex items-center justify-end px-12 transform skew-y-[-1deg] origin-bottom-right">
             <div className="text-white text-right">
               <p className="text-[10px] font-black uppercase tracking-widest">{company.name}</p>
               <p className="text-[9px] opacity-80">{company.email || company.phone || ""}</p>
             </div>
          </div>
        </div>
      </BaseDocument>
    );
  }
);

DeliveryNoteTemplate.displayName = 'DeliveryNoteTemplate';

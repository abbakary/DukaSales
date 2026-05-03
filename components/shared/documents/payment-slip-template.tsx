"use client";

import React from 'react';
import { PaymentSlipData } from '@/lib/types/documents';
import { format } from 'date-fns';
import { BaseDocument } from './base-document';
import { CheckCircle2 } from 'lucide-react';
import { getFullImageUrl } from "@/lib/utils";

interface PaymentSlipTemplateProps {
  data: PaymentSlipData;
}

export const PaymentSlipTemplate = React.forwardRef<HTMLDivElement, PaymentSlipTemplateProps>(
  ({ data }, ref) => {
    const { company, customer, amount, paymentMethod, receiptNumber, date, referenceNumber, notes } = data;

    return (
      <BaseDocument ref={ref}>
        <div className="p-12 relative h-full flex flex-col items-center">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[#005d9a]"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#005d9a]/5 rounded-bl-full"></div>
          
          <div className="w-full flex justify-between items-start mb-12">
            <div className="flex items-center gap-4">
              {company.logo ? (
                <img src={getFullImageUrl(company.logo)} alt={company.name} className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-[#005d9a] rounded-lg flex items-center justify-center text-white text-xl font-bold">
                  {company.name[0]}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{company.name}</h1>
                <p className="text-[10px] text-slate-500 font-medium max-w-[200px]">{company.address}</p>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-3xl font-black text-[#005d9a] uppercase tracking-tighter">PAYMENT SLIP</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">NO: {receiptNumber}</p>
            </div>
          </div>

          <div className="w-full bg-slate-50 border-y border-slate-100 p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-[#a0c43c] rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Payment Received From</h3>
            <p className="text-2xl font-black text-slate-800 uppercase">{customer.name}</p>
            <div className="w-24 h-1 bg-[#a0c43c] rounded-full"></div>
          </div>

          <div className="w-full mt-12 grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase">Payment Date</p>
                <p className="text-sm font-bold text-slate-700">{format(date, 'MMMM dd, yyyy')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase">Payment Method</p>
                <p className="text-sm font-bold text-slate-700 uppercase">{paymentMethod}</p>
              </div>
              {referenceNumber && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Reference Number</p>
                  <p className="text-sm font-bold text-slate-700">{referenceNumber}</p>
                </div>
              )}
            </div>

            <div className="bg-[#005d9a] text-white p-8 rounded-2xl flex flex-col justify-center items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
               <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8"></div>
               
               <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Amount Paid</p>
               <h4 className="text-4xl font-black">
                 {company.currencySymbol}{amount.toFixed(2)}
               </h4>
               <p className="text-[10px] font-medium mt-4 opacity-60">Authorized Receipt</p>
            </div>
          </div>

          <div className="w-full mt-12">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Remarks / Notes</p>
             <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg italic">
               "{notes || 'Thank you for your payment. This is a computer-generated receipt.'}"
             </p>
          </div>

          <div className="mt-auto w-full flex justify-between items-end pt-12">
             <div className="text-[10px] text-slate-400 font-medium">
               <p>{company.email}</p>
               <p>{company.phone}</p>
               <p>{company.address}</p>
             </div>
             
             <div className="text-center">
               <div className="w-48 h-px bg-slate-200 mb-2"></div>
               <p className="text-[10px] font-black text-slate-800 uppercase">Authorized Signature</p>
               <p className="text-[8px] text-slate-400 uppercase mt-1">{company.name}</p>
             </div>
          </div>
        </div>
      </BaseDocument>
    );
  }
);

PaymentSlipTemplate.displayName = 'PaymentSlipTemplate';

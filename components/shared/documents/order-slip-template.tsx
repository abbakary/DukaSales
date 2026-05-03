"use client";

import React from "react";
import { format } from "date-fns";
import { ClipboardList } from "lucide-react";
import { BaseDocument } from "./base-document";
import { OrderSlipData } from "@/lib/types/documents";
import { getFullImageUrl } from "@/lib/utils";

interface OrderSlipTemplateProps {
  data: OrderSlipData;
}

export const OrderSlipTemplate = React.forwardRef<HTMLDivElement, OrderSlipTemplateProps>(
  ({ data }, ref) => {
    const { company, customer, items, subtotal, discountAmount, taxAmount, total, date, documentNumber, servedBy } = data;

    return (
      <BaseDocument ref={ref}>
        <div className="p-10 relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#0b4a8b]" />
          <div className="absolute top-2 left-0 right-0 h-1 bg-[#f59e0b]" />

          <div className="flex items-start justify-between pt-4">
            <div className="flex items-center gap-3">
              {company.logo ? (
                <img src={getFullImageUrl(company.logo)} alt={company.name} className="h-14 w-14 rounded-md object-contain border bg-white" />
              ) : (
                <div className="h-14 w-14 rounded-md bg-[#0b4a8b] text-white flex items-center justify-center font-black text-xl">
                  {company.name[0]}
                </div>
              )}
              <div>
                <p className="text-xl font-black tracking-tight uppercase text-slate-900">{company.name}</p>
                <p className="text-xs text-slate-600">{company.address || "-"}</p>
                <p className="text-xs text-slate-600">{company.phone || "-"} · {company.email || "-"}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-[#0b4a8b] px-3 py-1 border border-blue-100">
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Order Slip</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-600">No: {documentNumber}</p>
              <p className="text-xs font-semibold text-slate-600">Date: {format(date, "MMM dd, yyyy HH:mm")}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Customer</p>
              <p className="text-sm font-bold text-slate-800">{customer?.name || "Walk-in Customer"}</p>
              <p className="text-xs text-slate-600">{customer?.phone || customer?.email || "-"}</p>
              <p className="text-xs text-slate-600">{customer?.address || "-"}</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Order Info</p>
              <p className="text-sm font-bold text-slate-800">Type: POS Sale</p>
              <p className="text-xs text-slate-600">Served by: {servedBy || "-"}</p>
              <p className="text-xs text-slate-600">Items: {items.length}</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0b4a8b] text-white">
                  <th className="py-2 px-3 text-left text-xs font-black uppercase">Description</th>
                  <th className="py-2 px-3 text-center text-xs font-black uppercase w-20">Qty</th>
                  <th className="py-2 px-3 text-right text-xs font-black uppercase w-28">Unit</th>
                  <th className="py-2 px-3 text-right text-xs font-black uppercase w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-2 px-3 text-sm font-semibold text-slate-800">
                      {item.description}
                      {item.sku ? <p className="text-[10px] text-slate-500 font-medium">SKU: {item.sku}</p> : null}
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-slate-700">{item.quantity} {item.unit}</td>
                    <td className="py-2 px-3 text-right text-sm text-slate-700">{company.currencySymbol}{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-sm font-bold text-slate-900">{company.currencySymbol}{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-72 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold">{company.currencySymbol}{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Discount</span><span className="font-semibold">{company.currencySymbol}{discountAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Tax</span><span className="font-semibold">{company.currencySymbol}{taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between rounded bg-[#0b4a8b] text-white px-3 py-2 mt-2">
                <span className="font-black uppercase tracking-wide">Total</span>
                <span className="font-black">{company.currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </BaseDocument>
    );
  }
);

OrderSlipTemplate.displayName = "OrderSlipTemplate";

"use client";

import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Truck, Quote, Download, ClipboardList, ZoomIn, ZoomOut } from 'lucide-react';
import dynamic from 'next/dynamic';
import { InvoiceTemplate } from './invoice-template';
import { QuotationTemplate } from './quotation-template';
import { DeliveryNoteTemplate } from './delivery-note-template';
import { PaymentSlipTemplate } from './payment-slip-template';
import { OrderSlipTemplate } from './order-slip-template';

const PrintButton = dynamic(() => import('./print-button').then(mod => mod.PrintButton), {
  ssr: false,
});
import { 
  InvoiceData, 
  QuotationData, 
  DeliveryNoteData, 
  PaymentSlipData,
  OrderSlipData,
  DocumentType 
} from '@/lib/types/documents';

interface DocumentPreviewDialogProps {
  trigger?: React.ReactNode;
  data: {
    invoice?: InvoiceData;
    quotation?: QuotationData;
    deliveryNote?: DeliveryNoteData;
    paymentSlip?: PaymentSlipData;
    orderSlip?: OrderSlipData;
  };
  defaultType?: DocumentType;
}

export function DocumentPreviewDialog({ trigger, data, defaultType = 'invoice' }: DocumentPreviewDialogProps) {
  const [activeType, setActiveType] = useState<DocumentType>(defaultType);
  const [zoom, setZoom] = useState(0.85);
  const printRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom((z) => Math.min(1.2, Number((z + 0.05).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(0.6, Number((z - 0.05).toFixed(2))));

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline"><FileText className="w-4 h-4 mr-2" /> Preview Document</Button>}
      </DialogTrigger>
      <DialogContent className="w-[98vw] h-[95vh] max-w-[1600px] sm:max-w-[1600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#005d9a]" />
              Document Preview
            </DialogTitle>
            <DialogDescription className="sr-only">
              Preview and print business documents by type.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 pr-8">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4 mr-1" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4 mr-1" />
              Zoom In
            </Button>
            <div className="px-2 text-xs font-bold text-slate-500 min-w-[52px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            <PrintButton contentRef={printRef} label={`Print ${activeType.replace('_', ' ')}`} />
            <PrintButton 
              contentRef={printRef} 
              label="Download PDF" 
              className="bg-[#005d9a] hover:bg-[#004a7a] text-white border-none shadow-lg shadow-[#005d9a]/20" 
              icon={<Download className="w-4 h-4 mr-2" />}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-60 bg-slate-50 border-r p-6 flex flex-col gap-3 shrink-0 overflow-y-auto">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 px-2 tracking-[0.2em]">Document Types</p>
            <Button 
              variant={activeType === 'invoice' ? 'default' : 'ghost'} 
              className={`justify-start h-12 rounded-xl font-bold transition-all ${activeType === 'invoice' ? 'bg-[#005d9a] shadow-lg shadow-[#005d9a]/20' : ''}`}
              onClick={() => setActiveType('invoice')}
              disabled={!data.invoice}
            >
              <FileText className="w-4 h-4 mr-3" /> Invoice
            </Button>
            <Button 
              variant={activeType === 'quotation' ? 'default' : 'ghost'} 
              className={`justify-start h-12 rounded-xl font-bold transition-all ${activeType === 'quotation' ? 'bg-[#0095da] shadow-lg shadow-[#0095da]/20' : ''}`}
              onClick={() => setActiveType('quotation')}
              disabled={!data.quotation}
            >
              <Quote className="w-4 h-4 mr-3" /> Quotation
            </Button>
            <Button 
              variant={activeType === 'delivery_note' ? 'default' : 'ghost'} 
              className={`justify-start h-12 rounded-xl font-bold transition-all ${activeType === 'delivery_note' ? 'bg-slate-800 shadow-lg shadow-slate-800/20' : ''}`}
              onClick={() => setActiveType('delivery_note')}
              disabled={!data.deliveryNote}
            >
              <Truck className="w-4 h-4 mr-3" /> Delivery Note
            </Button>
            <Button 
              variant={activeType === 'payment_slip' ? 'default' : 'ghost'} 
              className={`justify-start h-12 rounded-xl font-bold transition-all ${activeType === 'payment_slip' ? 'bg-[#a0c43c] shadow-lg shadow-[#a0c43c]/20' : ''}`}
              onClick={() => setActiveType('payment_slip')}
              disabled={!data.paymentSlip}
            >
              <Receipt className="w-4 h-4 mr-3" /> Payment Slip
            </Button>
            <Button 
              variant={activeType === 'order_slip' ? 'default' : 'ghost'} 
              className={`justify-start h-12 rounded-xl font-bold transition-all ${activeType === 'order_slip' ? 'bg-[#0b4a8b] shadow-lg shadow-[#0b4a8b]/20' : ''}`}
              onClick={() => setActiveType('order_slip')}
              disabled={!data.orderSlip}
            >
              <ClipboardList className="w-4 h-4 mr-3" /> Order Slip
            </Button>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-slate-200/50 p-4 md:p-8 overflow-auto">
            <div className="min-w-[760px] flex justify-center pb-8">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                <div className="w-[210mm] shadow-2xl bg-white h-fit shrink-0">
                  {activeType === 'invoice' && data.invoice && (
                    <InvoiceTemplate ref={printRef} data={data.invoice} />
                  )}
                  {activeType === 'quotation' && data.quotation && (
                    <QuotationTemplate ref={printRef} data={data.quotation} />
                  )}
                  {activeType === 'delivery_note' && data.deliveryNote && (
                    <DeliveryNoteTemplate ref={printRef} data={data.deliveryNote} />
                  )}
                  {activeType === 'payment_slip' && data.paymentSlip && (
                    <PaymentSlipTemplate ref={printRef} data={data.paymentSlip} />
                  )}
                  {activeType === 'order_slip' && data.orderSlip && (
                    <OrderSlipTemplate ref={printRef} data={data.orderSlip} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

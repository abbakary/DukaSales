"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Printer, FileDown } from 'lucide-react';

interface PrintButtonProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  label?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function PrintButton({ contentRef, label = "Print Document", className, icon }: PrintButtonProps) {
  const handlePrint = useReactToPrint({
    contentRef: contentRef as any,
    documentTitle: label,
  });

  return (
    <Button 
      onClick={() => handlePrint()}
      variant="outline" 
      className={`bg-white hover:bg-slate-50 text-slate-900 border-slate-200 font-bold rounded-xl h-11 px-6 shadow-sm transition-all active:scale-95 ${className}`}
    >
      {icon || <Printer className="w-4 h-4 mr-2 text-[#005d9a]" />}
      {className?.includes('w-8') ? null : label}
    </Button>
  );
}

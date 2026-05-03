"use client";

import React from 'react';

interface BaseDocumentProps {
  children: React.ReactNode;
}

export const BaseDocument = React.forwardRef<HTMLDivElement, BaseDocumentProps>(
  ({ children }, ref) => {
    return (
      <div 
        ref={ref}
        className="bg-white text-slate-900 mx-auto print:shadow-none print:p-0 w-full max-w-[210mm] print:w-[210mm] shadow-sm"
        style={{
          minHeight: '297mm',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff'
        }}
      >
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        {children}
      </div>
    );
  }
);

BaseDocument.displayName = 'BaseDocument';

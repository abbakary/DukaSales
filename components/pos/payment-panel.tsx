"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  ArrowLeft, Receipt, CheckCircle2,
  Wallet, AlertCircle, ShieldCheck, MinusCircle,
  Info, RefreshCw, ArrowRight, Check, Printer,
  FileText, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { usePOSStore } from "@/lib/stores/pos-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Numpad } from "./numpad"
import { toast } from "sonner"
import Link from "next/link"
import { DocumentPreviewDialog } from "@/components/shared/documents/document-preview-dialog"
import {
  transformTransactionToInvoice,
  transformTransactionToQuotation,
  transformTransactionToDeliveryNote,
  transformTransactionToPaymentSlip,
  transformTransactionToOrderSlip
} from "@/lib/utils/document-transform"
import type { PaymentMethod, Transaction } from "@/lib/types"
import { QRCodeCanvas } from "qrcode.react"
import { Input } from "@/components/ui/input"
import { apiFetch, getApiBaseUrl } from "@/lib/api/client"
import { useI18n } from "@/lib/i18n/use-i18n"

interface PaymentPanelProps {
  onComplete: () => void
  onBack: () => void
}

type Method = { method: PaymentMethod; label: string; icon: React.ElementType; color: string; activeColor: string }

const METHODS: Method[] = [
  { method: "cash", label: "Cash", icon: Wallet, color: "bg-emerald-500", activeColor: "bg-emerald-600" },
  { method: "card", label: "Card", icon: ShieldCheck, color: "bg-blue-500", activeColor: "bg-blue-600" },
  { method: "mobile", label: "Mobile", icon: Info, color: "bg-purple-500", activeColor: "bg-purple-600" },
  { method: "credit", label: "Credit", icon: AlertCircle, color: "bg-amber-500", activeColor: "bg-amber-600" },
]

export function PaymentPanel({ onComplete, onBack }: PaymentPanelProps) {
  const {
    items, total, selectedCustomer,
    completeSale, payments, addPayment,
    removePayment, clearPayments, refreshTotals
  } = usePOSStore()

  const { user, company } = useAuthStore()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash")
  const [numpadValue, setNumpadValue] = useState("")
  const [completing, setCompleting] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [dueDate, setDueDate] = useState<string>("")
  const currency = company?.currencySymbol || "Tsh"

  const paidAmount = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments])
  const remainingAmount = Math.max(0, total - paidAmount)
  const changeAmount = Math.max(0, paidAmount - total)
  
  // The amount that will be recorded as debt (remaining balance)
  const amountToCredit = (selectedCustomer && remainingAmount > 0.01) ? remainingAmount : 0;
  
  const [phone, setPhone] = useState("")
  const [sendingSms, setSendingSms] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    refreshTotals()
  }, [refreshTotals])

  const canCompleteSale = (remainingAmount <= 0.01) || (selectedCustomer !== null)

  const handleNumpadSubmit = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return
    
    // Safety check for non-credit payments: cannot exceed total
    if (selectedMethod !== 'credit') {
      const wouldBePaid = paidAmount + value;
      if (wouldBePaid > total + 0.01) { // Small buffer for float math
        toast.error(`Malipo ya ${selectedMethod.toUpperCase()} hayawezi kuzidi jumla ya deni. Tafadhali ingiza kiasi sahihi.`);
        return;
      }
      addPayment({ method: selectedMethod, amount: value })
    } else {
      // For credit mode, entering an amount via numpad counts as "Paid So Far" (down payment)
      // We'll record it as a cash payment to represent the physical money received now.
      addPayment({ method: 'cash', amount: value })
    }
    
    setNumpadValue("")
  }

  const handleComplete = async () => {
    if (remainingAmount > 0 && selectedMethod !== "credit") return
    if (remainingAmount > 0 && selectedMethod === "credit" && !selectedCustomer) {
      toast.error(t('pos.creditRequiresCustomer'))
      return
    }

    setCompleting(true)

    try {
      const txn = await completeSale(user?.id || "", dueDate)
      if (txn) {
        setLastTransaction(txn)
        setShowReceipt(true)
      } else {
        toast.error("Unable to complete sale. Please review payment details.")
      }
    } catch (error) {
      console.error("Failed to complete sale:", error)
      toast.error("Failed to complete sale.")
    } finally {
      setCompleting(false)
    }
  }

  const handleNewSale = () => {
    setShowReceipt(false)
    setLastTransaction(null)
    setPhone("")
    clearPayments()
    onComplete()
  }

  const handleSendReceipt = async () => {
    if (!lastTransaction || !phone) return
    setSendingSms(true)
    try {
      await apiFetch(`/api/v1/receipts/${lastTransaction.id}/send`, {
        method: "POST",
        body: JSON.stringify({ phone_number: phone })
      })
      toast.success("Risiti imetumwa kikamilifu!")
      setPhone("")
    } catch (e: any) {
      toast.error(`Imeshindwa kutuma: ${e.message}`)
    } finally {
      setSendingSms(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background/50 backdrop-blur-md">
      {items.length === 0 && !showReceipt ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 p-12 text-center">
          <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center border-2 border-dashed">
            <Receipt className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">{t('pos.checkoutEmpty')}</h3>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">{t('pos.addItemsToBegin')}</p>
          </div>
          <Button onClick={onBack} variant="outline" className="rounded-xl h-12 px-8 font-black uppercase tracking-widest gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('pos.returnToCart')}
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-background/50 px-6 py-4 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl hover:bg-muted transition-all">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight leading-none">{t('pos.payment')}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">{t('pos.transactionSummary')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('pos.totalAmount')}</p>
              <p className="text-2xl font-black tracking-tighter text-indigo-600">{currency}{total.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 lg:grid-cols-[320px_1fr] overflow-hidden">
            {/* Left Column: Payment Methods & Details */}
            <div className="flex min-w-0 flex-col border-r bg-muted/5 overflow-hidden">
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4">
                  {/* Methods Grid */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">{t('pos.selectMethod')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {METHODS.map((m) => (
                        <button
                          key={m.method}
                          onClick={() => setSelectedMethod(m.method)}
                          className={cn(
                            "group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-3 transition-all active:scale-[0.98]",
                            selectedMethod === m.method
                              ? "border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100"
                              : "border-transparent bg-background hover:border-border hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-white transition-all duration-300",
                            selectedMethod === m.method ? m.activeColor : m.color,
                            "group-hover:scale-110 shadow-lg"
                          )}>
                            <m.icon className="h-4 w-4" />
                          </div>
                          <span className={cn(
                            "text-[11px] font-black uppercase tracking-tight",
                            selectedMethod === m.method ? "text-indigo-600" : "text-foreground"
                          )}>{m.label}</span>
                          {selectedMethod === m.method && (
                            <div className="absolute right-2 top-2 h-4 w-4 rounded-full bg-indigo-600 p-1 shadow-md">
                              <Check className="h-full w-full text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('pos.paymentTimeline')}</p>
                      <Button variant="ghost" size="sm" onClick={clearPayments} className="h-6 rounded-lg text-[9px] font-black uppercase text-rose-600 hover:bg-rose-50">
                        {t('pos.clearAll')}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {payments.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed p-5 text-center bg-background/50">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('pos.noPaymentsRecorded')}</p>
                        </div>
                      ) : (
                        payments.map((p, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl bg-background border p-2.5 shadow-sm group animate-in slide-in-from-left-2">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center text-white",
                                METHODS.find(m => m.method === p.method)?.color
                              )}>
                                {React.createElement(METHODS.find(m => m.method === p.method)?.icon || Wallet, { className: "h-4 w-4" })}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-tight">{p.method}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-black tracking-tight">{currency}{p.amount.toFixed(2)}</p>
                              <Button variant="ghost" size="icon" onClick={() => removePayment(i)} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Summary Stats Footer */}
              <div className="border-t bg-background/80 p-3 backdrop-blur-md space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/30 p-2.5 border shadow-inner">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Paid So Far</p>
                    <p className="text-lg font-black tracking-tighter mt-0.5">{currency}{paidAmount.toFixed(2)}</p>
                  </div>
                  <div className={cn(
                    "rounded-xl p-2.5 border shadow-inner transition-all",
                    amountToCredit > 0 ? "bg-amber-50 border-amber-200" : "bg-muted/10 border-transparent opacity-40"
                  )}>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-[0.15em]",
                      amountToCredit > 0 ? "text-amber-600" : "text-muted-foreground"
                    )}>Credit (To Debt)</p>
                    <p className={cn(
                      "text-lg font-black tracking-tighter mt-0.5",
                      amountToCredit > 0 ? "text-amber-700" : "text-muted-foreground"
                    )}>{currency}{amountToCredit.toFixed(2)}</p>
                  </div>
                </div>
                <div className={cn(
                  "rounded-xl p-3 border transition-colors shadow-inner flex justify-between items-center",
                  (remainingAmount > 0.01 && !selectedCustomer) ? "bg-indigo-50 border-indigo-100" : "bg-emerald-50 border-emerald-100"
                )}>
                  <div>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-[0.15em]",
                      (remainingAmount > 0.01 && !selectedCustomer) ? "text-indigo-600" : "text-emerald-600"
                    )}>
                      {(remainingAmount > 0.01 && !selectedCustomer) ? t('pos.balanceDue') : (amountToCredit > 0 ? "Closing as Credit Sale" : t('pos.changeDue'))}
                    </p>
                    <p className={cn(
                      "text-xl font-black tracking-tighter mt-0.5",
                      (remainingAmount > 0.01 && !selectedCustomer) ? "text-indigo-700" : "text-emerald-700"
                    )}>
                      {currency}{(remainingAmount > 0.01 && !selectedCustomer) ? remainingAmount.toFixed(2) : (amountToCredit > 0 ? amountToCredit.toFixed(2) : changeAmount.toFixed(2))}
                    </p>
                  </div>
                  {remainingAmount > 0.01 && !selectedCustomer && (
                    <div className="animate-pulse">
                      <AlertCircle className="h-5 w-5 text-indigo-400" />
                    </div>
                  )}
                  {amountToCredit > 0 && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in zoom-in duration-300" />
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Numpad & Actions */}
            <div className="flex-1 flex min-h-0 flex-col bg-background overflow-hidden border-l">
              <ScrollArea className="h-full bg-muted/5">
                <div className="p-3 md:p-4 pb-32">
                  <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
                    <div className="text-center relative py-0.5 shrink-0">
                      {/* Conditional Credit Mode Label */}
                      {amountToCredit > 0 ? (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-2 border border-white mx-auto w-fit">
                            <AlertCircle className="size-3" />
                            <span className="text-[9px] uppercase tracking-widest">Balance to Credit: {currency}{amountToCredit.toFixed(2)}</span>
                          </Badge>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <Receipt className="h-3 w-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">{t('pos.enterAmount')}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-background rounded-2xl shadow-md p-1.5 border border-muted/40 relative group shrink-0">
                      {/* Decorative gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-transparent opacity-30 pointer-events-none rounded-2xl" />
                      
                      <Numpad
                        value={numpadValue}
                        onChange={setNumpadValue}
                        onSubmit={handleNumpadSubmit}
                        activeMethod={selectedMethod}
                        currency={currency}
                        suggestedAmount={remainingAmount > 0 ? remainingAmount : undefined}
                      />
                    </div>

                    {/* Action Area */}
                    <div className="space-y-2 shrink-0">
                      {remainingAmount > 0.01 && selectedMethod !== 'credit' && (
                        <div className="space-y-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center justify-center gap-2"
                            onClick={() => handleNumpadSubmit(remainingAmount)}
                          >
                            <Check className="h-4 w-4" />
                            {t('pos.payExact')}: {currency}{remainingAmount.toFixed(2)}
                          </Button>
                        </div>
                      )}

                      {amountToCredit > 0 && (
                        <div className="py-1 text-center animate-in fade-in slide-in-from-bottom-1 duration-500 space-y-2">
                          <div className="bg-amber-50 p-2 rounded-xl border border-amber-100 shadow-inner">
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                              Debt: {currency}{amountToCredit.toFixed(2)}
                            </p>
                            <p className="text-[8px] font-bold text-amber-600 uppercase tracking-[0.2em]">
                              Added to {selectedCustomer?.name}'s account
                            </p>
                          </div>
                          
                          {/* Due Date Picker for Credit */}
                          <div className="flex flex-col gap-1 px-1">
                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest text-left ml-1">Set Due Date (Optional)</p>
                            <div className="relative group">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-amber-500" />
                              <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="h-9 pl-8 text-[10px] font-bold border-amber-200 bg-white focus-visible:ring-amber-500 rounded-xl"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        size="lg"
                        className={cn(
                          "w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 gap-3 shrink-0",
                          canCompleteSale
                            ? (remainingAmount > 0.01 ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/40" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/40")
                            : "bg-muted text-muted-foreground grayscale cursor-not-allowed"
                        )}
                        onClick={handleComplete}
                        disabled={completing || !canCompleteSale}
                      >
                        {completing ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5" />
                            {remainingAmount > 0.01 ? "Complete as Credit Sale" : t('pos.completeSale')}
                          </>
                        )}
                      </Button>
                      
                      {remainingAmount > 0.01 && !selectedCustomer && (
                        <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 animate-bounce">
                          <AlertCircle className="h-3 w-3" />
                          <p className="text-center text-[9px] font-black uppercase tracking-wider">
                            Select a customer for credit balance
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog - Full screen overlay */}
      <Dialog open={showReceipt} onOpenChange={(open) => !open && handleNewSale()}>
        <DialogContent className="max-w-lg w-full p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-3xl flex flex-col max-h-[95dvh]">
          <DialogTitle className="sr-only">Sale receipt</DialogTitle>
          <DialogDescription className="sr-only">View sale completion details and document actions.</DialogDescription>

          {/* Green success header */}
          <div className="bg-emerald-500 px-8 pt-10 pb-8 text-white text-center relative overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-wrap gap-8 items-center justify-center scale-150 rotate-12">
              {Array.from({ length: 20 }).map((_, i) => <CheckCircle2 key={i} className="w-12 h-12" />)}
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-2xl animate-in zoom-in-50 duration-500">
                <Check className="h-10 w-10 text-emerald-500 stroke-[4px]" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Sale Complete</h2>
                <p className="text-emerald-100 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Transaction Successful</p>
              </div>
            </div>
          </div>

          {/* Scrollable receipt body */}
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="p-6 space-y-5">

              {/* Receipt meta grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Receipt Number</p>
                  <p className="text-base font-black text-foreground">#{lastTransaction?.transactionNumber ?? "---"}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Customer</p>
                  <p className="text-base font-black text-foreground uppercase truncate">
                    {lastTransaction?.customerName ?? selectedCustomer?.name ?? "Walk-in Customer"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Date</p>
                  <p className="text-sm font-bold text-foreground">
                    {lastTransaction ? new Date(lastTransaction.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "---"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Cashier</p>
                  <p className="text-sm font-bold text-foreground uppercase truncate">
                    {lastTransaction?.cashierName ?? user?.name ?? "---"}
                  </p>
                </div>
              </div>

              <Separator className="opacity-30" />

              {/* Items */}
              {lastTransaction && lastTransaction.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Items</p>
                  <div className="space-y-1.5">
                    {lastTransaction.items.map((item: any, i: number) => {
                      const itemName = item.productName || item.name || 'Unknown Item';
                      const quantity = item.quantity || 0;
                      const unitPrice = item.unitPrice || item.price || 0;
                      const itemTotal = item.total || (quantity * unitPrice);
                      
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold truncate block">{itemName}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {quantity} × {currency}{unitPrice.toFixed(2)}
                            </span>
                          </div>
                          <span className="font-black ml-4 shrink-0">
                            {currency}{itemTotal.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator className="opacity-30" />

              {/* Totals */}
              <div className="space-y-2">
                {(lastTransaction?.discountAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-bold">Discount</span>
                    <span className="font-bold text-rose-600">-{currency}{(lastTransaction?.discountAmount ?? 0).toFixed(2)}</span>
                  </div>
                )}
                {(lastTransaction?.taxAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-bold">Tax</span>
                    <span className="font-bold">+{currency}{(lastTransaction?.taxAmount ?? 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Paid</span>
                  <span className="text-2xl font-black text-indigo-600 tracking-tighter">
                    {currency}{(lastTransaction?.amountPaid ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {(lastTransaction?.amountDue ?? 0) > 0 ? "Amount Due (Credit)" : "Change Due"}
                  </span>
                  <span className={`text-2xl font-black tracking-tighter ${(lastTransaction?.amountDue ?? 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {currency}{((lastTransaction?.amountDue ?? 0) > 0 ? (lastTransaction?.amountDue ?? 0) : (lastTransaction?.change ?? 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <Separator className="opacity-30" />

              {/* Digital Receipt / SMS */}
              {lastTransaction && (
                <div className="space-y-4 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Digital Receipt</p>
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="rounded-xl border p-4 bg-white shadow-sm">
                      <QRCodeCanvas 
                        value={`${getApiBaseUrl().replace('/api/v1', '')}/api/v1/receipts/${lastTransaction.id}`}
                        size={120}
                      />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Scan with phone</p>
                    
                    <div className="flex w-full items-center gap-2 max-w-xs mt-2">
                      <Input 
                        placeholder="Namba ya Simu..." 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-10 text-xs font-bold rounded-xl bg-muted/50 border-border/50 focus-visible:ring-emerald-500"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleSendReceipt} 
                        disabled={!phone || sendingSms}
                        className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black uppercase tracking-widest"
                      >
                        {sendingSms ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Tuma SMS"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Separator className="opacity-30" />

              {/* Documents */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Print &amp; Documents</p>
                <div className="grid grid-cols-2 gap-3">
                  {lastTransaction && (
                    <DocumentPreviewDialog
                      data={{
                        invoice: transformTransactionToInvoice(lastTransaction, company!, selectedCustomer || undefined),
                        quotation: transformTransactionToQuotation(lastTransaction, company!, selectedCustomer || undefined),
                        deliveryNote: transformTransactionToDeliveryNote(lastTransaction, company!, selectedCustomer || undefined),
                        paymentSlip: transformTransactionToPaymentSlip(lastTransaction, company!, selectedCustomer || undefined),
                        orderSlip: transformTransactionToOrderSlip(lastTransaction, company!, selectedCustomer || undefined),
                      }}
                      trigger={
                        <Button variant="outline" className="h-14 rounded-2xl font-black uppercase tracking-widest gap-2 border-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all group text-xs">
                          <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Branded Docs
                        </Button>
                      }
                    />
                  )}
                  <Button variant="outline" className="h-14 rounded-2xl font-black uppercase tracking-widest gap-2 border-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all group text-xs">
                    <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Thermal Receipt
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed action buttons at bottom */}
          <div className="shrink-0 flex gap-3 p-4 border-t bg-background">
            <Button asChild variant="secondary" size="lg" className="rounded-2xl h-14 font-black uppercase tracking-widest text-xs">
              <Link href="/dashboard/documents">Documents</Link>
            </Button>
            <Button variant="outline" size="lg" className="flex-1 rounded-2xl h-14 font-black border-2 hover:bg-muted transition-all uppercase tracking-widest text-xs" onClick={handleNewSale}>
              <RefreshCw className="mr-2 h-4 w-4" />
              New Sale
            </Button>
            <Button size="lg" className="flex-1 rounded-2xl h-14 font-black bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs" onClick={handleNewSale}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

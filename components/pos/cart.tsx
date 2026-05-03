"use client"

import { Trash2, Plus, Minus, ShoppingCart, Percent, User, Tag, ReceiptText, Pill, Calendar, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { usePOSStore } from "@/lib/stores/pos-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db/dexie"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/use-i18n"

export function Cart() {
  const {
    items, updateQuantity, removeItem, updateItemDiscount, updateItemTaxRate, updateItemTaxType,
    globalDiscount, setGlobalDiscount, globalDiscountType, setGlobalDiscountType,
    taxRate, setTaxRate, setTaxType, taxType,
    subtotal, discountAmount, taxAmount, total,
    clearCart, selectedCustomer,
  } = usePOSStore()
   const { company } = useAuthStore()
   const currency = company?.currencySymbol || "Tsh"
   const isPharmacy = company?.types?.includes('pharmacy') ?? false

  const stockByProductId = useLiveQuery(async () => {
    if (!company?.id) return new Map<string, number>()
    const products = await db.products.where("companyId").equals(company.id).toArray()
    return new Map(products.map((product) => [product.id, product.quantity ?? 0]))
  }, [company?.id], new Map<string, number>())
  const { t } = useI18n()

  const handleSafeQuantityUpdate = (index: number, nextQty: number) => {
    const item = items[index]
    if (!item) return
    const available = stockByProductId.get(item.productId)
    if (typeof available === "number" && nextQty > available) {
      toast.error(`Only ${available} ${item.unit} available for ${item.name}`)
      updateQuantity(index, available)
      return
    }
    updateQuantity(index, nextQty)
  }

  return (
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-md border-l shadow-2xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <p className="font-black text-sm tracking-tight">{t('pos.cart').toUpperCase()}</p>
            {items.length > 0 && (
              <p className="text-[10px] text-muted-foreground font-bold">{items.length} {t('pos.itemsSelected').toUpperCase()}</p>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="group flex items-center gap-1.5 text-[10px] font-black text-destructive/70 hover:text-destructive transition-colors uppercase tracking-widest"
          >
            <Trash2 className="h-3 w-3 group-hover:animate-bounce" />
            {t('pos.clearAll')}
          </button>
        )}
      </div>

      {/* ── Customer strip ── */}
      <div className={cn(
        "flex items-center gap-3 border-b px-4 py-2.5 shrink-0 transition-all duration-500",
        selectedCustomer ? "bg-primary/5" : "bg-muted/10"
      )}>
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          selectedCustomer ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <User className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xs font-bold truncate",
            selectedCustomer ? "text-primary" : "text-muted-foreground"
          )}>
            {selectedCustomer?.name ?? t('pos.walkInCustomer')}
          </p>
          {selectedCustomer && (
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-black bg-white/50">
                {selectedCustomer.priceLevel?.toUpperCase() ?? "REGULAR"}
              </Badge>
              {selectedCustomer.currentDebt > 0 && (
                <span className="text-[9px] text-destructive font-black">
                  DEBT: {currency}{selectedCustomer.currentDebt.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Items ── */}
      <ScrollArea className="flex-1 min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
              <div className="relative rounded-full bg-muted/50 p-6 border border-border/50">
                <ReceiptText className="h-10 w-10 text-muted-foreground/40" />
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">{t('pos.yourCartIsEmpty')}</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">{t('pos.addItemsToBegin')}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {items.map((item, index) => {
              const lineTotal = item.price * item.quantity * (1 - (item.discount || 0) / 100)
              return (
                <div key={`${item.productId}-${index}`} className="group px-4 py-3.5 hover:bg-muted/30 transition-colors">
                  {/* Row 1: name + total + delete */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black leading-tight group-hover:text-primary transition-colors">{item.name}</p>
                      
                      {/* Pharmacy Details */}
                      {isPharmacy && (item.genericName || item.dosage || item.batchNumber) && (
                        <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                          {item.genericName && (
                            <p className="text-[9px] font-bold text-primary italic uppercase tracking-tighter">
                              {item.genericName}
                            </p>
                          )}
                          {item.dosage && (
                            <Badge variant="outline" className="text-[8px] h-3 px-1 font-black bg-primary/5 text-primary border-primary/20">
                              {item.dosage}
                            </Badge>
                          )}
                          {item.batchNumber && (
                            <div className="flex items-center gap-0.5 text-[8px] font-bold text-muted-foreground bg-muted px-1 rounded">
                              <Info className="h-2 w-2" />
                              BN: {item.batchNumber}
                            </div>
                          )}
                          {item.expiryDate && (
                            <div className={cn(
                              "flex items-center gap-0.5 text-[8px] font-black px-1 rounded",
                              new Date(item.expiryDate) < new Date() ? "text-destructive bg-destructive/10" : "text-emerald-600 bg-emerald-500/10"
                            )}>
                              <Calendar className="h-2 w-2" />
                              EXP: {new Date(item.expiryDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground font-mono font-medium mt-1 uppercase tracking-tighter opacity-70">
                        {item.sku}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-foreground">{currency}{lineTotal.toFixed(2)}</span>
                      <button
                        onClick={() => removeItem(index)}
                        className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Pricing Details & Controls */}
                  <div className="flex items-end justify-between mt-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground/60">
                        {currency}{item.price.toFixed(2)} / {item.unit.toUpperCase()}
                      </p>
                      {item.discount > 0 && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                          <Tag className="h-2.5 w-2.5" />
                          {item.discount}% OFF
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Qty stepper */}
                      <div className="flex items-center bg-background rounded-xl border border-border/50 shadow-sm overflow-hidden h-8">
                        <button
                          onClick={() => handleSafeQuantityUpdate(index, Math.max(0.01, item.quantity - 1))}
                          className="flex h-full w-8 items-center justify-center hover:bg-muted text-muted-foreground active:scale-90 transition-all"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <Input
                          type="number" min="0.01" step="0.01"
                          value={item.quantity}
                          onChange={e => handleSafeQuantityUpdate(index, Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                          className="h-full w-10 border-0 text-center text-xs font-black p-0 focus-visible:ring-0"
                        />
                        <button
                          onClick={() => handleSafeQuantityUpdate(index, item.quantity + 1)}
                          className="flex h-full w-8 items-center justify-center hover:bg-muted text-muted-foreground active:scale-90 transition-all"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Item discount input */}
                      <div className="flex items-center gap-1 bg-background rounded-xl border border-border/50 px-2 h-8">
                        <Percent className="h-2.5 w-2.5 text-muted-foreground" />
                        <Input
                          type="number" min="0" max="100" step="1"
                          placeholder="0"
                          value={item.discount || ""}
                          onChange={e => updateItemDiscount(index, Math.min(100, parseFloat(e.target.value) || 0))}
                          className="h-full w-8 border-0 text-center text-[10px] font-bold p-0 focus-visible:ring-0"
                        />
                      </div>

                      {/* Item tax rate input */}
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[7px] font-black text-muted-foreground uppercase leading-none">Add Tax</span>
                        <div className="flex items-center gap-1 bg-background rounded-xl border border-border/50 px-2 h-8">
                          <button 
                            onClick={() => updateItemTaxType(index, item.taxType === 'fixed' ? 'percentage' : 'fixed')}
                            className="text-[8px] font-black text-primary hover:bg-primary/10 px-1 rounded transition-colors"
                            title="Toggle between Percentage and Fixed Amount"
                          >
                            {item.taxType === 'fixed' ? currency : 'TAX'}
                          </button>
                          <Input
                            type="number" min="0" max={item.taxType === 'fixed' ? 1000000 : 100} step={item.taxType === 'fixed' ? 1 : 0.5}
                            placeholder={taxRate.toString()}
                            value={item.taxRate !== undefined ? item.taxRate : ""}
                            onChange={e => updateItemTaxRate(index, e.target.value ? Math.min(item.taxType === 'fixed' ? 1000000 : 100, parseFloat(e.target.value)) : undefined)}
                            className="h-full w-10 border-0 text-center text-[10px] font-bold p-0 focus-visible:ring-0"
                          />
                          <span className="text-[8px] font-black text-muted-foreground">{item.taxType === 'fixed' ? '' : '%'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* ── Totals ── */}
      {items.length > 0 && (
        <div className="border-t bg-muted/30 backdrop-blur-md p-5 space-y-4 shrink-0">
          {/* Global discount */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Tag className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('pos.applyDiscount')}</p>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number" min="0" step="0.01"
                  value={globalDiscount || ""}
                  onChange={e => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                  className="h-8 w-full text-xs font-bold border-border/50 shadow-inner"
                  placeholder="0.00"
                />
                <div className="flex rounded-lg border border-border/50 overflow-hidden shadow-sm h-8 shrink-0">
                  <button
                    onClick={() => setGlobalDiscountType("percentage")}
                    className={cn(
                      "w-8 text-[10px] font-black transition-all",
                      globalDiscountType === "percentage" ? "bg-indigo-600 text-white" : "bg-background hover:bg-muted"
                    )}
                  >%</button>
                  <button
                    onClick={() => setGlobalDiscountType("fixed")}
                    className={cn(
                      "w-8 text-[10px] font-black border-l border-border/50 transition-all",
                      globalDiscountType === "fixed" ? "bg-indigo-600 text-white" : "bg-background hover:bg-muted"
                    )}
                  >{currency}</button>
                </div>
              </div>
            </div>
          </div>

          {/* Global tax */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ReceiptText className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Apply Tax (Add to Total)</p>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number" min="0" step="0.01"
                  value={taxRate || ""}
                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="h-8 w-full text-xs font-bold border-border/50 shadow-inner"
                  placeholder="0.00"
                />
                <div className="flex rounded-lg border border-border/50 overflow-hidden shadow-sm h-8 shrink-0">
                  <button
                    onClick={() => setTaxType("percentage")}
                    className={cn(
                      "w-8 text-[10px] font-black transition-all",
                      taxType === "percentage" ? "bg-primary text-white" : "bg-background hover:bg-muted"
                    )}
                  >%</button>
                  <button
                    onClick={() => setTaxType("fixed")}
                    className={cn(
                      "w-8 text-[10px] font-black border-l border-border/50 transition-all",
                      taxType === "fixed" ? "bg-primary text-white" : "bg-background hover:bg-muted"
                    )}
                  >{currency}</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-bold text-muted-foreground/80">
              <span>{t('pos.subtotal').toUpperCase()}</span>
              <span>{currency}{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs font-bold text-emerald-600 bg-emerald-500/5 px-2 py-1 rounded-lg">
                <span>{t('pos.totalSavings').toUpperCase()}</span>
                <span>-{currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-xs font-bold text-muted-foreground/80">
                <span>{t('pos.estimatedTax').toUpperCase()}</span>
                <span>{currency}{taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between bg-indigo-600 rounded-2xl p-4 shadow-xl shadow-indigo-500/20">
              <div className="text-white">
                <p className="text-[10px] font-black opacity-60 tracking-[0.2em] uppercase">{t('pos.totalDue')}</p>
                <p className="text-2xl font-black tracking-tighter leading-none mt-1">{currency}{total.toFixed(2)}</p>
              </div>
              <ReceiptText className="h-8 w-8 text-white/20" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { ProductGrid } from "@/components/pos/product-grid"
import { Cart } from "@/components/pos/cart"
import { PaymentPanel } from "@/components/pos/payment-panel"
import { useAuthStore } from "@/lib/stores/auth-store"
import { usePOSStore } from "@/lib/stores/pos-store"
import { db } from "@/lib/db/dexie"
import { mockProducts, mockCategories } from "@/lib/db/mock-data"
import type { Product, Category, Customer } from "@/lib/types"
import { createTenantResource } from "@/lib/api/tenant"
import { syncTenantDataFromApi } from "@/lib/services/sync-from-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User, Search, X, PauseCircle, PlayCircle,
  Trash2, ShoppingCart, Clock, ChevronRight,
  LayoutGrid, Receipt, UserCircle2, Wallet, SearchIcon, UserPlus,
  CheckCircle2, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { v4 as uuid } from "uuid"
import { useI18n } from "@/lib/i18n/use-i18n"

type View = "products" | "payment"

export default function POSPage() {
  const [view, setView] = useState<View>("products")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerOpen, setCustomerOpen] = useState(false)
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false)
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  })
  const [holdOpen, setHoldOpen] = useState(false)

  const { company, token } = useAuthStore()
  const {
    items, total, clearCart,
    selectedCustomer, setSelectedCustomer,
    holdTransaction, recallTransaction, deleteHeldTransaction, heldTransactions,
    refreshTotals
  } = usePOSStore()

  const currency = company?.currencySymbol || "Tsh"
  const { t } = useI18n()

  // Refresh totals on mount to handle rehydrated state correctly
  useEffect(() => {
    refreshTotals()
  }, [refreshTotals])

  /* ── Load products from DB, fallback to mock ── */
  const dbProducts = useLiveQuery(async () => {
    if (!company?.id) return null
    const r = await db.products.where("companyId").equals(company.id).filter(p => p.isActive).toArray()
    return r.length > 0 ? r : null
  }, [company?.id])

  const dbCategories = useLiveQuery(async () => {
    if (!company?.id) return null
    const r = await db.categories.where("companyId").equals(company.id).toArray()
    return r.length > 0 ? r : null
  }, [company?.id])

  const customers = useLiveQuery(async () => {
    if (!company?.id) return []
    return db.customers.where("companyId").equals(company.id).filter(c => c.isActive).toArray()
  }, [company?.id], [])

  useEffect(() => {
    const id = company?.id || "company-1"
    const businessTypes = company?.types || ['retail']
    
    let baseProducts = dbProducts ?? mockProducts.filter(p => p.companyId === id)
    
    // Strict filtering: If company is a pharmacy, show only pharmacy products
    // If company is retail, show retail products, etc.
    const filtered = baseProducts.filter(p => {
      // If product has a specific businessType, it must match one of the shop's types
      if (p.businessType) {
        return businessTypes.includes(p.businessType as any)
      }
      
      // Heuristic: If shop is a pharmacy and product has pharmacy-only fields, it's a match
      if (businessTypes.includes('pharmacy' as any) && (p.genericName || p.dosage || p.form)) {
        return true
      }

      // If shop is ONLY a pharmacy, don't show generic items that don't look like medicines
      if (businessTypes.length === 1 && businessTypes[0] === 'pharmacy') {
        return !!(p.genericName || p.dosage || p.form)
      }
      
      // Default: If it's a mixed shop, allow generic products
      return true
    })

    setProducts(filtered)
  }, [dbProducts, company])

   useEffect(() => {
     const id = company?.id || "company-1"
     const businessTypes = company?.types || ['retail']
     
     let baseCategories = dbCategories ?? mockCategories.filter(c => c.companyId === id)
     
     // Filter categories based on business type strings in name (case-insensitive)
     const filtered = baseCategories.filter(c => {
       if (businessTypes.length === 1) {
         const type = businessTypes[0].toUpperCase()
         const suffix = `(${type})`
         // Use case-insensitive match for the suffix
         return c.name.toUpperCase().includes(suffix) || !c.name.includes('(')
       }
       return true
     })

     setCategories(filtered)
   }, [dbCategories, company])

  const filteredCustomers = (customers || []).filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || "").toLowerCase().includes(customerSearch.toLowerCase())
  )

  const selectCustomer = (c: Customer | null) => {
    setSelectedCustomer(c)
    setCustomerOpen(false)
    setCustomerSearch("")
    if (c) toast.success(`${t('pos.customer')}: ${c.name}`)
  }

  const handleHold = () => {
    if (!items.length) { toast.error(t('pos.yourCartIsEmpty')); return }
    holdTransaction()
    toast.success("Transaction held — cart cleared")
  }

  const handleComplete = () => {
    clearCart()
    setView("products")
  }

  const canProceedToCheckout = () => {
    const stockByProductId = new Map(products.map((product) => [product.id, product.quantity]))
    const invalidItem = items.find((item) => {
      const available = stockByProductId.get(item.productId)
      return typeof available === "number" && item.quantity > available
    })
    if (invalidItem) {
      const available = stockByProductId.get(invalidItem.productId) ?? 0
      toast.error(`Checkout blocked: only ${available} ${invalidItem.unit} available for ${invalidItem.name}`)
      return false
    }
    return true
  }

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.name.trim()) {
      toast.error(t('pos.customerNameRequired'))
      return
    }
    if (!token || !company?.id) {
      toast.error("Session expired. Please login again.")
      return
    }

    setCreatingCustomer(true)
    const tempId = uuid()
    try {
      const created = await createTenantResource<any>(
        "customers",
        {
          id: tempId,
          name: newCustomerForm.name.trim(),
          phone: newCustomerForm.phone.trim() || undefined,
          email: newCustomerForm.email.trim() || undefined,
          address: newCustomerForm.address.trim() || undefined,
          credit_limit: 0,
          current_debt: 0,
          is_active: true,
        },
        token
      )

      await syncTenantDataFromApi(token)

      const customer: Customer = {
        id: created?.id || tempId,
        companyId: company.id,
        name: created?.name || newCustomerForm.name.trim(),
        phone: created?.phone || newCustomerForm.phone.trim() || undefined,
        email: created?.email || newCustomerForm.email.trim() || undefined,
        address: created?.address || newCustomerForm.address.trim() || undefined,
        creditLimit: Number(created?.credit_limit ?? 0),
        currentDebt: Number(created?.current_debt ?? 0),
        loyaltyPoints: 0,
        isActive: created?.is_active ?? true,
        createdAt: created?.created_at ? new Date(created.created_at) : new Date(),
        updatedAt: created?.updated_at ? new Date(created.updated_at) : new Date(),
      }

      selectCustomer(customer)
      setCreateCustomerOpen(false)
      setNewCustomerForm({ name: "", phone: "", email: "", address: "" })
      toast.success(`Customer created: ${customer.name}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create customer")
    } finally {
      setCreatingCustomer(false)
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">

      {/* ── LEFT PANEL ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-r shadow-sm relative z-10">

        {/* Toolbar */}
        <div className="flex items-center gap-4 border-b bg-muted/20 backdrop-blur-md px-4 py-3 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black tracking-widest uppercase opacity-40">Section</p>
              <p className="text-sm font-black uppercase tracking-tight">{view === "products" ? t('sidebar.inventory') : t('pos.payment')}</p>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 mx-2" />

          {/* Customer selection area */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomerOpen(true)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-2 text-sm font-black transition-all group shadow-sm",
                selectedCustomer
                  ? "bg-indigo-600 text-white border-transparent"
                  : "bg-background border-border hover:bg-muted hover:border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCircle2 className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", selectedCustomer ? "text-white/70" : "text-muted-foreground")} />
              <span className="max-w-[150px] truncate uppercase tracking-tight">
                {selectedCustomer?.name ?? t('pos.selectCustomer')}
              </span>
              {selectedCustomer && (
                <div onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors">
                  <X className="h-3 w-3" />
                </div>
              )}
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Hold */}
            <Button
              variant="outline" size="sm"
              className="h-10 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest border-border shadow-sm hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
              onClick={handleHold}
              disabled={!items.length}
            >
              <PauseCircle className="h-4 w-4" />
              {t('pos.hold')}
            </Button>

            {/* Recall */}
            <Button
              variant="outline" size="sm"
              className="relative h-10 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest border-border shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
              onClick={() => setHoldOpen(true)}
            >
              <PlayCircle className="h-4 w-4" />
              {t('pos.recall')}
              {heldTransactions.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-lg animate-in zoom-in-50">
                  {heldTransactions.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-muted/5">
          {view === "products"
            ? <ProductGrid products={products} categories={categories} />
            : <PaymentPanel onComplete={handleComplete} onBack={() => setView("products")} />
          }
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-col shrink-0 overflow-hidden shadow-2xl relative z-20"
        style={{ width: "clamp(280px, 20vw, 320px)" }}>

        {/* Cart fills all available height */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Cart />
        </div>

        {/* Checkout / back button */}
        <div className="shrink-0 border-t bg-background/80 backdrop-blur-md p-5">
          {view === "payment" ? (
            <Button 
              variant="outline" 
              className="w-full h-16 rounded-2xl border-2 font-black uppercase tracking-widest gap-3 shadow-sm hover:bg-muted transition-all active:scale-95" 
              onClick={() => setView("products")}
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
              {t('pos.backToProducts')}
            </Button>
          ) : items.length === 0 ? (
            <div className="flex h-16 items-center justify-center rounded-2xl bg-muted/30 border-2 border-dashed border-border/50 text-xs font-black text-muted-foreground uppercase tracking-widest">
              {t('pos.addProductsToCheckout')}
            </div>
          ) : (
            <button
              onClick={() => {
                if (canProceedToCheckout()) setView("payment")
              }}
              className="flex w-full h-18 items-center justify-between rounded-2xl bg-indigo-600 px-6 py-4 font-black text-white shadow-xl shadow-indigo-500/30 transition-all hover:bg-indigo-700 active:scale-[0.98] group"
            >
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-0.5">{t('pos.readyForCheckout')}</span>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 group-hover:animate-bounce" />
                  <span className="text-xl tracking-tight uppercase">{t('pos.checkout')}</span>
                  <Badge className="bg-white/20 text-white border-0 text-[10px] h-4 px-1.5 font-black">
                    {items.length}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-2xl font-black tracking-tighter">
                {currency}{total.toFixed(2)}
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ── CUSTOMER DIALOG ── */}
      <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
        <DialogContent className="max-w-md gap-0 p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
          <DialogHeader className="bg-indigo-600 px-6 py-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <UserCircle2 className="h-32 w-32" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{t('pos.selectCustomer')}</DialogTitle>
            <DialogDescription className="text-indigo-100 font-medium opacity-80">
              {t('pos.assignTransactionToCustomer')}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 bg-muted/30 border-b">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={t('pos.searchCustomer')}
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="h-12 pl-12 bg-background border-border/50 rounded-xl font-bold shadow-sm focus-visible:ring-primary"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="p-3 space-y-1">
              {/* Walk-in */}
              <button
                onClick={() => selectCustomer(null)}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left hover:bg-muted transition-all active:scale-[0.98] group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-tight">{t('pos.walkInCustomer')}</p>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">{t('pos.guestCheckout')}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:translate-x-1 transition-all" />
              </button>

              <Separator className="my-2 opacity-50" />

              {filteredCustomers.length > 0 && (
                <>
                  <div className="px-4 py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      {t('pos.registeredCustomers')} ({filteredCustomers.length})
                    </p>
                  </div>
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="flex w-full items-center gap-4 rounded-2xl p-4 text-left hover:bg-indigo-50/50 transition-all active:scale-[0.98] group"
                    >
                      <Avatar className="h-12 w-12 shrink-0 rounded-2xl border-2 border-transparent group-hover:border-indigo-200 transition-all">
                        <AvatarFallback className="bg-indigo-600 text-white text-sm font-black rounded-xl">
                          {c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-black uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground font-bold tracking-tight">{c.phone || c.email || t('pos.noContact')}</p>
                      </div>
                      <div className="shrink-0 text-right space-y-1">
                        {c.currentDebt > 0 ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-rose-500" />
                              <p className="text-[10px] font-black text-rose-600">
                                {currency}{c.currentDebt.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-[7px] font-black uppercase text-rose-400 tracking-tighter">UNPAID BALANCE</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              <p className="text-[10px] font-black text-emerald-600">
                                {currency}0.00
                              </p>
                            </div>
                            <p className="text-[7px] font-black uppercase text-emerald-400 tracking-tighter">CLEAR ACCOUNT</p>
                          </div>
                        )}
                        <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 h-4 border-indigo-200 bg-indigo-50 text-indigo-700">
                          {c.priceLevel || "regular"}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {filteredCustomers.length === 0 && customerSearch && (
                <div className="py-20 text-center space-y-3">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                    <SearchIcon className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    {t('pos.noMatchingAccounts')}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 bg-muted/20 border-t">
             <Button
                className="w-full h-12 rounded-xl font-black uppercase tracking-widest gap-2"
                onClick={() => setCreateCustomerOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                {t('pos.createNewAccount')}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createCustomerOpen} onOpenChange={setCreateCustomerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pos.createCustomer')}</DialogTitle>
            <DialogDescription>{t('pos.addCustomerContinue')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t('pos.nameRequired')}</p>
              <Input
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t('pos.customerName')}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t('settings.phone')}</p>
              <Input
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder={t('pos.phoneNumber')}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t('settings.email')}</p>
              <Input
                type="email"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t('settings.email')}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t('settings.address')}</p>
              <Input
                value={newCustomerForm.address}
                onChange={(e) => setNewCustomerForm((f) => ({ ...f, address: e.target.value }))}
                placeholder={t('settings.address')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateCustomerOpen(false)}>
              {t('pos.cancel')}
            </Button>
            <Button onClick={handleCreateCustomer} disabled={creatingCustomer}>
              {creatingCustomer ? t('common.loading') : t('pos.createAndSelect')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── HOLD / RECALL DIALOG ── */}
      <Dialog open={holdOpen} onOpenChange={setHoldOpen}>
        <DialogContent className="max-w-md gap-0 p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
          <DialogHeader className="bg-amber-500 px-6 py-8 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{t('pos.onHold')}</DialogTitle>
            <DialogDescription className="text-amber-50 font-medium opacity-80 uppercase tracking-widest text-[10px] font-black">
              {t('pos.manageSuspended')}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px]">
            {heldTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-32 text-center px-8">
                <div className="rounded-full bg-muted/50 p-6 border-2 border-dashed">
                  <Clock className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">{t('pos.noTransactionsOnHold')}</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {heldTransactions.map(held => {
                  const heldTotal = held.items.reduce((s, i) => s + i.price * i.quantity, 0)
                  return (
                    <div key={held.id} className="flex items-center gap-4 rounded-2xl border bg-background p-4 shadow-sm group hover:border-amber-200 transition-all">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black uppercase tracking-tight">{held.customer?.name || t('pos.walkInCustomer')}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                          {held.items.length} items · {currency}{heldTotal.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">
                          {new Date(held.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={() => {
                            recallTransaction(held.id)
                            setHoldOpen(false)
                            setView("products")
                            toast.success(t('pos.transactionResumed'))
                          }}
                        >
                          {t('pos.resume')}
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="h-10 w-10 rounded-xl p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            deleteHeldTransaction(held.id)
                            toast.success(t('pos.heldDeleted'))
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )

}

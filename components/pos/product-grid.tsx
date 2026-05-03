"use client"

import { useState, useMemo } from "react"
import { Search, Grid3X3, List, Package, Plus, Pill, HardHat, Warehouse, Store } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePOSStore } from "@/lib/stores/pos-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useBusinessFeatures } from "@/lib/hooks/use-business-features"
import { toast } from "sonner"
import type { Product, Category } from "@/lib/types"
import { PharmacyProductGrid } from "./pharmacy-product-grid"

interface ProductGridProps {
  products: Product[]
  categories: Category[]
}

export function ProductGrid({ products, categories }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { addItem, items } = usePOSStore()
  const { company } = useAuthStore()
  const features = useBusinessFeatures()
  const currency = company?.currencySymbol || "Tsh"

  const businessTypes = features.businessTypes;
  const isPharmacyOnly = businessTypes.length === 1 && businessTypes[0] === 'pharmacy';
  const isCurrentlyPharmacy = selectedType === 'pharmacy' || (isPharmacyOnly && !selectedType);

  // If in pharmacy mode, use the specialized medicine search UI
  if (isCurrentlyPharmacy) {
    return (
      <div className="flex flex-col h-full">
        {/* Type Tabs if multiple types exist */}
        {businessTypes.length > 1 && (
          <div className="shrink-0 border-b bg-muted/30 p-1 flex gap-1">
            {businessTypes.map(type => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type === selectedType ? null : type);
                  setSelectedCategory(null);
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                  selectedType === type
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}
              >
                {type === 'retail' && <Store className="h-3.5 w-3.5" />}
                {type === 'pharmacy' && <Pill className="h-3.5 w-3.5" />}
                {type === 'building' && <HardHat className="h-3.5 w-3.5" />}
                {type === 'wholesale' && <Warehouse className="h-3.5 w-3.5" />}
                {type}
              </button>
            ))}
          </div>
        )}
        <PharmacyProductGrid products={products} />
      </div>
    );
  }

  const parentCategories = useMemo(
    () => {
      let cats = categories.filter(c => !c.parentId);
      if (selectedType) {
        const suffix = `(${selectedType.toUpperCase()})`;
        cats = cats.filter(c => c.name.toUpperCase().includes(suffix));
      }
      return cats;
    },
    [categories, selectedType]
  )

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q)
      
      const matchType = !selectedType || 
        p.businessType === selectedType ||
        (selectedType === 'pharmacy' && (p.genericName || p.dosage || p.form));
      
      const matchCat = !selectedCategory || p.categoryId === selectedCategory ||
        categories.some(c => c.parentId === selectedCategory && c.id === p.categoryId)
      
      return matchSearch && matchCat && matchType && p.isActive
    })
  }, [products, searchQuery, selectedCategory, selectedType, categories])

  const getCartQty = (productId: string) =>
    items.find(i => i.productId === productId)?.quantity ?? 0

  const getStockStatus = (p: Product) => {
    if (p.quantity <= 0) return "out"
    if (p.quantity <= (p.minStock ?? 10)) return "low"
    return "ok"
  }

  const isExpired = (p: Product) => {
    if (!features.hasExpiryTracking || !p.expiryDate) return false
    return new Date(p.expiryDate) < new Date()
  }

  const isExpiringSoon = (p: Product) => {
    if (!features.hasExpiryTracking || !p.expiryDate) return false
    const days = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000)
    return days <= 30 && days > 0
  }

  const handleAdd = async (product: Product) => {
    const status = getStockStatus(product)
    if (status === "out") { toast.error(`${product.name} is out of stock`); return }
    if (isExpired(product)) { toast.error(`${product.name} has expired`); return }
    const inCartQty = items
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + item.quantity, 0)
    if (inCartQty + 1 > product.quantity) {
      toast.error(`Only ${product.quantity} ${product.unit} available for ${product.name}`)
      return
    }
    await addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.sellingPrice,
      quantity: 1,
      unit: product.unit,
      discount: 0,
    })
    toast.success(`${product.name} added`, { duration: 1200 })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + view toggle */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5 shrink-0 bg-background">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 shrink-0">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon" className="h-7 w-7"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon" className="h-7 w-7"
            onClick={() => setViewMode("list")}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Business Type Tabs — only if multi-tenant/multi-type */}
      {businessTypes.length > 1 && (
        <div className="shrink-0 border-b bg-muted/30 p-1 flex gap-1">
          {businessTypes.map(type => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type === selectedType ? null : type);
                setSelectedCategory(null);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                selectedType === type
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              {type === 'retail' && <Store className="h-3.5 w-3.5" />}
              {type === 'pharmacy' && <Pill className="h-3.5 w-3.5" />}
              {type === 'building' && <HardHat className="h-3.5 w-3.5" />}
              {type === 'wholesale' && <Warehouse className="h-3.5 w-3.5" />}
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Category pills — horizontally scrollable */}
      <div className="shrink-0 border-b bg-background">
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            All Products
          </button>
          {parentCategories.map(cat => {
            const count = products.filter(p => p.isActive && (
              p.categoryId === cat.id ||
              categories.some(c => c.parentId === cat.id && c.id === p.categoryId)
            )).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Product area — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <div className="rounded-full bg-muted p-5">
              <Package className="h-10 w-10" />
            </div>
            <p className="font-medium">No products found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProducts.map(product => {
              const status = getStockStatus(product)
              const expired = isExpired(product)
              const expiring = isExpiringSoon(product)
              const cartQty = getCartQty(product.id)
              const disabled = status === "out" || expired

              return (
                <button
                  key={product.id}
                  onClick={() => handleAdd(product)}
                  disabled={disabled}
                  className={cn(
                    "group relative flex flex-col rounded-xl border bg-card text-left transition-all duration-150",
                    "hover:border-primary hover:shadow-md hover:shadow-primary/10 active:scale-[0.98]",
                    disabled && "cursor-not-allowed opacity-50 hover:border-border hover:shadow-none"
                  )}
                >
                  {/* Cart qty badge */}
                  {cartQty > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {cartQty}
                    </span>
                  )}

                  {/* Status badges */}
                  {(status !== "ok" || expired || expiring) && (
                    <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
                      {expired && <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-bold text-white">EXPIRED</span>}
                      {!expired && status === "low" && <span className="rounded-full bg-yellow-500 px-1.5 py-0.5 text-[9px] font-bold text-white">LOW</span>}
                      {!expired && status === "out" && <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">OUT</span>}
                      {expiring && !expired && <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">EXP SOON</span>}
                    </div>
                  )}

                  {/* Product icon area */}
                  <div className="flex aspect-square items-center justify-center rounded-t-xl bg-muted/60 group-hover:bg-primary/5 transition-colors">
                    <Package className="h-9 w-9 text-muted-foreground group-hover:text-primary/60 transition-colors" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-0.5 p-2.5">
                    <p className="line-clamp-2 text-xs font-semibold leading-tight">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{product.sku}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">{currency}{product.sellingPrice.toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground">{product.quantity} {product.unit}</span>
                    </div>
                  </div>

                  {/* Add overlay on hover */}
                  {!disabled && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary/0 group-hover:bg-primary/5 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <Plus className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          /* List view */
          <div className="divide-y">
            {filteredProducts.map(product => {
              const status = getStockStatus(product)
              const expired = isExpired(product)
              const cartQty = getCartQty(product.id)
              const disabled = status === "out" || expired

              return (
                <button
                  key={product.id}
                  onClick={() => handleAdd(product)}
                  disabled={disabled}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {status === "low" && <Badge className="bg-yellow-100 text-yellow-800 text-[10px] h-4 px-1">Low</Badge>}
                    {status === "out" && <Badge variant="destructive" className="text-[10px] h-4 px-1">Out</Badge>}
                    {expired && <Badge variant="destructive" className="text-[10px] h-4 px-1">Expired</Badge>}
                    {cartQty > 0 && <Badge className="text-[10px] h-4 px-1">×{cartQty}</Badge>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{currency}{product.sellingPrice.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">{product.quantity} {product.unit}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

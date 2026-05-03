"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Search, Pill, Package, AlertCircle, ShoppingCart, Info, ScanLine, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePOSStore } from "@/lib/stores/pos-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useBusinessFeatures } from "@/lib/hooks/use-business-features"
import { toast } from "sonner"
import type { Product, ProductBatch } from "@/lib/types"
import { db } from "@/lib/db/dexie"

interface PharmacyProductGridProps {
  products: Product[]
}

export function PharmacyProductGrid({ products }: PharmacyProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [batches, setBatches] = useState<ProductBatch[]>([])
  const { addPharmacyItem, items } = usePOSStore()
  const { company } = useAuthStore()
  const features = useBusinessFeatures()
  const currency = company?.currencySymbol || "Tsh"
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = searchQuery.toLowerCase()
    const filtered = products.filter(p => 
      p.isActive && (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q) ||
        (p.genericName || "").toLowerCase().includes(q)
      )
    )
    if (searchQuery.length >= 2) {
      setSearchResults(filtered.slice(0, 10))
    } else {
      setSearchResults(filtered.slice(0, 10).sort((a, b) => b.quantity - a.quantity))
    }
  }, [searchQuery, products])

  useEffect(() => {
    if (selectedProduct) {
      db.productBatches.where('productId').equals(selectedProduct.id).toArray()
        .then(res => {
          const sorted = res.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
          setBatches(sorted)
        })
    }
  }, [selectedProduct])

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleAddItem = async (isPack: boolean = false) => {
    if (!selectedProduct) return
    const inCartQty = items
      .filter((item) => item.productId === selectedProduct.id)
      .reduce((sum, item) => sum + item.quantity, 0)
    if (inCartQty + 1 > selectedProduct.quantity) {
      toast.error(`Only ${selectedProduct.quantity} ${selectedProduct.unit} in stock`)
      return
    }
    
    if (selectedProduct.requiresPrescription) {
      toast.warning(`Prescription Required for ${selectedProduct.name}`, {
        description: "Please verify the customer has a valid prescription.",
        duration: 5000,
      })
    }

    await addPharmacyItem(selectedProduct, 1, isPack)
    toast.success(`${selectedProduct.name} added to cart`)
    
    // Clear selection after adding
    setSelectedProduct(null)
    setBatches([])
    searchInputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Search Header */}
      <div className="p-4 bg-background border-b shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search medicines by Name, Generic Name, SKU or Scan Barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg rounded-xl shadow-inner border-primary/20 focus-visible:ring-primary/30"
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-muted-foreground animate-pulse" />
          </div>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-50 left-4 right-4 mt-2 bg-background border rounded-xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto">
            {searchResults.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className="w-full flex items-center justify-between p-4 hover:bg-primary/5 border-b last:border-0 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-base truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                        {p.genericName}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {p.dosage} • {p.form}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{currency}{p.sellingPrice.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Stock: {p.quantity} {p.unit}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Selection Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedProduct ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
            <Pill className="h-20 w-20 mb-4 stroke-1" />
            <p className="text-xl font-medium">Search for a medicine to begin</p>
            <p className="text-sm">Optimized for Pharmacy Workflow (FEFO & Batch tracking)</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Product Card */}
            <div className="bg-background rounded-2xl border p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Pill className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{selectedProduct.name}</h2>
                    <p className="text-muted-foreground">{selectedProduct.genericName} • {selectedProduct.dosage} • {selectedProduct.form}</p>
                    <div className="flex gap-2 mt-2">
                      {selectedProduct.requiresPrescription && (
                        <Badge variant="destructive" className="font-bold">RX REQUIRED</Badge>
                      )}
                      <Badge variant="outline" className="font-bold uppercase">{selectedProduct.unit}</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">{currency}{selectedProduct.sellingPrice.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Main Stock: {selectedProduct.quantity}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  size="lg" 
                  className="h-16 text-lg font-black rounded-xl"
                  onClick={() => handleAddItem(false)}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  ADD SINGLE ({selectedProduct.unit})
                </Button>
                {selectedProduct.unitsPerPack && selectedProduct.unitsPerPack > 1 && (
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="h-16 text-lg font-black rounded-xl"
                    onClick={() => handleAddItem(true)}
                  >
                    <Package className="mr-2 h-5 w-5" />
                    ADD PACK ({selectedProduct.unitsPerPack} units)
                  </Button>
                )}
              </div>
            </div>

            {/* Batch Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                Inventory Batches (FEFO Tracking)
              </h3>
              <div className="grid gap-3">
                {batches.length === 0 ? (
                  <div className="bg-background rounded-xl border p-4 text-center text-sm text-muted-foreground italic">
                    No active batches found for this product. System will deduct from main stock.
                  </div>
                ) : (
                  batches.map((b, i) => {
                    const isExpired = new Date(b.expiryDate) < new Date()
                    const isExpiringSoon = !isExpired && (new Date(b.expiryDate).getTime() - Date.now()) < 30 * 86400000
                    
                    return (
                      <div 
                        key={b.id}
                        className={cn(
                          "bg-background rounded-xl border p-4 flex items-center justify-between transition-all",
                          i === 0 && !isExpired ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "",
                          isExpired && "opacity-50 grayscale"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            i === 0 && !isExpired ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <span className="font-bold text-sm">B{i+1}</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm">Batch: {b.batchNumber}</p>
                            <p className={cn(
                              "text-xs",
                              isExpired ? "text-destructive font-bold" : 
                              isExpiringSoon ? "text-orange-500 font-bold" : "text-muted-foreground"
                            )}>
                              Expires: {new Date(b.expiryDate).toLocaleDateString()}
                              {isExpired && " (EXPIRED)"}
                              {isExpiringSoon && " (EXPIRING SOON)"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{b.quantity} in stock</p>
                          {i === 0 && !isExpired && (
                            <Badge className="bg-primary text-[10px] font-black uppercase tracking-tighter">Next for Sale</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

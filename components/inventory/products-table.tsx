"use client"

import { useState, useMemo } from "react"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Plus,
  Filter,
  Download,
  Package,
  AlertTriangle,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useBusinessFeatures } from "@/lib/hooks/use-business-features"
import type { Product, Category } from "@/lib/types"

interface ProductsTableProps {
  products: Product[]
  categories: Category[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onAdd: () => void
}

export function ProductsTable({
  products,
  categories,
  onEdit,
  onDelete,
  onAdd,
}: ProductsTableProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { company } = useAuthStore()
  const features = useBusinessFeatures()
  const currency = company?.currencySymbol || "Tsh"

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        categoryFilter === "all" || product.categoryId === categoryFilter

      let matchesStatus = true
      if (statusFilter === "active") matchesStatus = product.isActive
      if (statusFilter === "inactive") matchesStatus = !product.isActive
      if (statusFilter === "low-stock") matchesStatus = product.quantity <= product.minStock && product.quantity > 0
      if (statusFilter === "out-of-stock") matchesStatus = product.quantity <= 0

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, search, categoryFilter, statusFilter])

  const getStockBadge = (product: Product) => {
    if (product.quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (product.quantity <= product.minStock) {
      return <Badge className="bg-warning text-warning-foreground">Low Stock</Badge>
    }
    return <Badge className="bg-success text-success-foreground">In Stock</Badge>
  }

  const getExpiryBadge = (product: Product) => {
    if (!features.expiryTracking || !product.expiryDate) return null
    
    const daysUntilExpiry = Math.ceil(
      (new Date(product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (daysUntilExpiry <= 30) {
      return <Badge className="bg-warning text-warning-foreground">Expires in {daysUntilExpiry}d</Badge>
    }
    return null
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Uncategorized"
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your inventory products ({filteredProducts.length} items)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={onAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead>Status</TableHead>
              {features.expiryTracking && <TableHead>Expiry</TableHead>}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={features.expiryTracking ? 9 : 8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-10 w-10" />
                    <p>No products found</p>
                    {search && <p className="text-sm">Try adjusting your search</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {product.barcode && (
                            <p className="text-[10px] text-muted-foreground bg-muted px-1 rounded">{product.barcode}</p>
                          )}
                          {features.businessTypes.includes('pharmacy') && (product.genericName || product.dosage) && (
                            <p className="text-[10px] text-primary font-medium italic">
                              {product.genericName}{product.dosage ? ` (${product.dosage})` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                  <TableCell className="text-right">
                    {currency}{product.costPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {currency}{product.sellingPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {product.quantity <= product.minStock && product.quantity > 0 && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      <span className={cn(
                        "font-medium",
                        product.quantity <= 0 && "text-destructive",
                        product.quantity <= product.minStock && product.quantity > 0 && "text-warning"
                      )}>
                        {product.quantity}
                      </span>
                      <span className="text-muted-foreground">{product.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStockBadge(product)}</TableCell>
                  {features.expiryTracking && (
                    <TableCell>
                      {product.expiryDate ? (
                        <div className="flex items-center gap-2">
                          {getExpiryBadge(product) || (
                            <span className="text-sm text-muted-foreground">
                              {new Date(product.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(product)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

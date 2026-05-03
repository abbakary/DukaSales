'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Upload,
  Package,
  AlertTriangle,
  ArrowUpDown,
  QrCode,
  Printer,
} from 'lucide-react';
import { ProductForm } from '@/components/inventory/product-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import type { Product, Category, BusinessType } from '@/lib/types';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import { createTenantResource, deleteTenantResource, updateTenantResource } from '@/lib/api/tenant';
import { syncTenantDataFromApi } from '@/lib/services/sync-from-api';

export default function InventoryPage() {
  const { company, token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);

  const products = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.products.where('companyId').equals(company.id).toArray();
    },
    [company?.id],
    []
  );

  const categories = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.categories.where('companyId').equals(company.id).toArray();
    },
    [company?.id],
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const parentCategories = categories?.filter(c => !c.parentId) || [];

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  // Helper to infer business type from category name
  const inferBusinessType = (cat: Category): BusinessType | undefined => {
    const typeSuffix = cat.name.match(/\((\w+)\)$/)?.[1]?.toLowerCase();
    if (typeSuffix && ['retail', 'pharmacy', 'building', 'wholesale'].includes(typeSuffix)) {
      return typeSuffix as BusinessType;
    }
    // If category has parent, check parent
    if (cat.parentId) {
      const parent = categories?.find(c => c.id === cat.parentId);
      if (parent) {
        const parentSuffix = parent.name.match(/\((\w+)\)$/)?.[1]?.toLowerCase();
        if (parentSuffix && ['retail', 'pharmacy', 'building', 'wholesale'].includes(parentSuffix)) {
          return parentSuffix as BusinessType;
        }
      }
    }
    return undefined;
  };

  const inferBusinessTypeFromCategoryId = (categoryId?: string): BusinessType | undefined => {
    if (!categoryId || !categories?.length) return undefined;
    const category = categories.find(c => c.id === categoryId);
    if (!category) return undefined;
    return inferBusinessType(category);
  };

  const filteredProducts = (products || []).filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.quantity <= product.minStock;
    } else if (stockFilter === 'out') {
      matchesStock = product.quantity === 0;
    } else if (stockFilter === 'in') {
      matchesStock = product.quantity > product.minStock;
    }
    return matchesSearch && matchesCategory && matchesStock && product.isActive;
  });

  const selectedProducts = filteredProducts.filter((product) =>
    selectedProductIds.includes(product.id)
  );

  const previewProducts = selectedProducts.length > 0 ? selectedProducts : filteredProducts;

  const stats = {
    total: products?.length || 0,
    lowStock: products?.filter(p => p.quantity <= p.minStock && p.quantity > 0).length || 0,
    outOfStock: products?.filter(p => p.quantity === 0).length || 0,
    totalValue: products?.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0) || 0,
  };

  const handleDelete = async () => {
    if (productToDelete) {
      try {
        if (!token) throw new Error('Session expired');
        await updateTenantResource('products', productToDelete, { is_active: false }, token);
        await syncTenantDataFromApi(token);
        toast.success('Product deleted successfully');
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete product');
      }
    }
  };

  const handleSaveProduct = async (data: any) => {
    try {
      if (!token) throw new Error('Session expired');
      
      const productId = editProduct?.id || uuid();
      
      // Infer businessType from the product's selected category, fallback to company's primary type
      let businessType: BusinessType | undefined = inferBusinessTypeFromCategoryId(data.categoryId);
      
      // Fallback to company's first business type if still undefined
      if (!businessType && company?.types && company.types.length > 0) {
        businessType = company.types[0] as BusinessType;
      }
      
      const payload = {
        category_id: data.categoryId,
        sku: data.sku,
        name: data.name,
        unit: data.unit,
        cost_price: data.costPrice ?? 0,
        selling_price: data.sellingPrice ?? 0,
        tax_rate: data.taxRate ?? 0,
        quantity: data.quantity ?? 0,
        min_stock: data.minStock ?? 0,
        is_active: data.isActive ?? true,
        business_type: businessType,
        
        // Pharmacy extensions
        generic_name: data.genericName || undefined,
        brand_name: data.brandName || undefined,
        dosage: data.dosage || undefined,
        form: data.form || undefined,
        requires_prescription: data.requiresPrescription,
        units_per_pack: Number(data.unitsPerPack) || 1,
      };

      if (editProduct) {
        await updateTenantResource('products', productId, payload, token);
        toast.success('Product updated');
      } else {
        await createTenantResource('products', { id: productId, ...payload }, token);
        toast.success('Product added');
      }

      // Handle Batches if provided
      if (data.batches && data.batches.length > 0) {
        for (const b of data.batches) {
          // If editing, we might want to check if batch exists, but for now we just create/update
          // For simplicity in this turn, we create new batches
          await createTenantResource('product_batches', {
            id: b.id || uuid(),
            product_id: productId,
            batch_number: b.batchNumber,
            expiry_date: new Date(b.expiryDate).toISOString(),
            quantity: Number(b.quantity) || 0,
          }, token);
        }
      } else if (data.batchNumber && data.expiryDate) {
        // Handle single batch from the initial fields
        await createTenantResource('product_batches', {
          id: uuid(),
          product_id: productId,
          batch_number: data.batchNumber,
          expiry_date: new Date(data.expiryDate).toISOString(),
          quantity: Number(data.quantity) || 0,
        }, token);
      }

      await syncTenantDataFromApi(token);
      setFormOpen(false);
      setEditProduct(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    }
  };

  const buildQrLabelsHtml = (items: Product[], title: string) => {
    const labelsHtml = items.map((product) => {
      const qrSrc = product.qrCode ? `data:image/png;base64,${product.qrCode}` : '';
      return `
        <div class="label-card">
          <div class="label-header">
            <div>
              <div class="label-title">${product.name}</div>
              <div class="label-category">${getCategoryName(product.categoryId)}</div>
            </div>
            <div class="label-price">${company?.currencySymbol}${product.sellingPrice.toLocaleString()}</div>
          </div>
          <div class="label-qr-wrap">
            ${qrSrc ? `<img src="${qrSrc}" alt="${product.name}" />` : '<div class="label-no-qr">No QR</div>'}
          </div>
          <div class="label-footer">
            <div class="label-meta"><span>SKU</span><strong>${product.sku}</strong></div>
            <div class="label-meta"><span>Stock</span><strong>${product.quantity} ${product.unit}</strong></div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              background: #f5f7fb;
              color: #0f172a;
            }
            .page {
              padding: 24px;
            }
            .page-header {
              display: flex;
              justify-content: space-between;
              align-items: end;
              gap: 16px;
              margin-bottom: 20px;
            }
            .page-title {
              font-size: 28px;
              font-weight: 800;
              margin: 0 0 6px;
            }
            .page-subtitle {
              margin: 0;
              color: #64748b;
              font-size: 13px;
            }
            .labels-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
              gap: 16px;
            }
            .label-card {
              background: white;
              border: 1px solid #dbe3f0;
              border-radius: 20px;
              padding: 16px;
              page-break-inside: avoid;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            }
            .label-header {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              align-items: start;
              margin-bottom: 14px;
            }
            .label-title {
              font-size: 15px;
              font-weight: 800;
              line-height: 1.3;
              margin-bottom: 4px;
            }
            .label-category {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              font-weight: 700;
            }
            .label-price {
              white-space: nowrap;
              font-weight: 800;
              font-size: 16px;
              color: #2563eb;
            }
            .label-qr-wrap {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 170px;
              border-radius: 16px;
              background: linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%);
              border: 1px solid #e2e8f0;
              margin-bottom: 14px;
              padding: 12px;
            }
            .label-qr-wrap img {
              width: 150px;
              height: 150px;
              object-fit: contain;
            }
            .label-no-qr {
              font-size: 12px;
              color: #64748b;
              font-weight: 700;
            }
            .label-footer {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .label-meta {
              border-radius: 12px;
              background: #f8fafc;
              padding: 10px 12px;
            }
            .label-meta span {
              display: block;
              font-size: 10px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              margin-bottom: 4px;
              font-weight: 700;
            }
            .label-meta strong {
              display: block;
              font-size: 12px;
              color: #0f172a;
            }
            @media print {
              body { background: white; }
              .page { padding: 10px; }
              .label-card {
                box-shadow: none;
                border-color: #d6dde8;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="page-header">
              <div>
                <h1 class="page-title">${title}</h1>
                <p class="page-subtitle">${company?.name || 'Shop'} · ${items.length} item label(s)</p>
              </div>
            </div>
            <div class="labels-grid">
              ${labelsHtml}
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 400);
            };
          </script>
        </body>
      </html>
    `;
  };

  const printQrLabels = (items: Product[], title: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(buildQrLabelsHtml(items, title));
    printWindow.document.close();
  };

  const toggleProductSelection = (productId: string, checked: boolean) => {
    setSelectedProductIds((current) =>
      checked ? [...new Set([...current, productId])] : current.filter((id) => id !== productId)
    );
  };

  const toggleSelectAllFiltered = (checked: boolean) => {
    setSelectedProductIds(checked ? filteredProducts.map((product) => product.id) : []);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your products and stock levels</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setQrPreviewOpen(true)}
            disabled={filteredProducts.length === 0}
          >
            <QrCode className="mr-2 size-4" />
            QR Preview
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              printQrLabels(
                previewProducts,
                selectedProducts.length > 0 ? 'Selected QR Labels' : 'All QR Labels'
              )
            }
            disabled={previewProducts.length === 0}
          >
            <Printer className="mr-2 size-4" />
            {selectedProducts.length > 0 ? 'Print Selected' : 'Print All'}
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 size-4" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <Button onClick={() => { setEditProduct(null); setFormOpen(true); }}>
            <Plus className="mr-2 size-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <AlertTriangle className="size-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.outOfStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {company?.currencySymbol}{stats.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>{filteredProducts.length} products found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                      onCheckedChange={(checked) => toggleSelectAllFiltered(checked === true)}
                      aria-label="Select all products"
                    />
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="p-0 h-auto font-medium">
                      Product
                      <ArrowUpDown className="ml-2 size-4" />
                    </Button>
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProductIds.includes(product.id)}
                          onCheckedChange={(checked) => toggleProductSelection(product.id, checked === true)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                      <TableCell>
                        {product.qrCode ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <QrCode className="size-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>QR Code - {product.name}</DialogTitle>
                                <DialogDescription>
                                  Unique QR code for this product.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex items-center justify-center p-6">
                                <img
                                  src={`data:image/png;base64,${product.qrCode}`}
                                  alt={product.name}
                                  className="w-48 h-48 border rounded-lg p-2"
                                />
                              </div>
                              <DialogFooter className="sm:justify-center">
                                <Button onClick={() => printQrLabels([product], `QR Label - ${product.name}`)}>
                                  <Printer className="mr-2 size-4" />
                                  Print Label
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">No QR</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {company?.currencySymbol}{product.costPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {company?.currencySymbol}{product.sellingPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={product.quantity <= product.minStock ? 'text-destructive font-medium' : ''}>
                          {product.quantity} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {product.quantity === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : product.quantity <= product.minStock ? (
                          <Badge variant="secondary" className="bg-warning text-warning-foreground">Low Stock</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-success text-success-foreground">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditProduct(product); setFormOpen(true); }}>
                              <Edit className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => printQrLabels([product], `QR Label - ${product.name}`)}>
                              <Printer className="mr-2 size-4" />
                              Print Label
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedProductIds([product.id]);
                              setQrPreviewOpen(true);
                            }}>
                              <QrCode className="mr-2 size-4" />
                              Preview QR
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setProductToDelete(product.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
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
        </CardContent>
      </Card>

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editProduct}
        categories={categories || []}
        onSave={handleSaveProduct}
      />

      {/* Delete Dialog */}
      <Dialog open={qrPreviewOpen} onOpenChange={setQrPreviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProducts.length > 0 ? 'Selected QR Labels Preview' : 'All QR Labels Preview'}
            </DialogTitle>
            <DialogDescription>
              Preview and print attractive QR labels for {previewProducts.length} product{previewProducts.length === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-1">
            <div className="mb-4 grid gap-3 rounded-2xl border bg-muted/20 p-4 md:grid-cols-3">
              <div className="rounded-xl bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Scope</p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedProducts.length > 0 ? 'Selected products' : 'All filtered products'}
                </p>
              </div>
              <div className="rounded-xl bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total labels</p>
                <p className="mt-2 text-sm font-semibold">{previewProducts.length}</p>
              </div>
              <div className="rounded-xl bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Company</p>
                <p className="mt-2 text-sm font-semibold">{company?.name || 'Shop'}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {previewProducts.map((product) => (
                <div key={product.id} className="rounded-3xl border bg-background p-4 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="line-clamp-2 text-base font-bold">{product.name}</h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {getCategoryName(product.categoryId)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
                      {company?.currencySymbol}{product.sellingPrice.toLocaleString()}
                    </div>
                  </div>
                  <div className="mb-4 flex min-h-[200px] items-center justify-center rounded-2xl border bg-gradient-to-b from-slate-50 to-blue-50 p-4">
                    {product.qrCode ? (
                      <img
                        src={`data:image/png;base64,${product.qrCode}`}
                        alt={product.name}
                        className="h-44 w-44 object-contain"
                      />
                    ) : (
                      <div className="text-sm font-medium text-muted-foreground">No QR code available</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">SKU</p>
                      <p className="mt-1 break-all text-sm font-semibold">{product.sku}</p>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Stock</p>
                      <p className="mt-1 text-sm font-semibold">{product.quantity} {product.unit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setSelectedProductIds([])}>
              Clear Selection
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setQrPreviewOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() =>
                  printQrLabels(
                    previewProducts,
                    selectedProducts.length > 0 ? 'Selected QR Labels' : 'All QR Labels'
                  )
                }
                disabled={previewProducts.length === 0}
              >
                <Printer className="mr-2 size-4" />
                Print Preview
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

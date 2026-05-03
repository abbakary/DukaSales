'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import {
  ArrowLeft, Save, RefreshCw, Barcode, Package,
  Banknote, Layers, FlaskConical, ToggleRight, CheckCircle2,
  Pill, AlertCircle, Plus, Trash2, Sparkles, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useBusinessFeatures } from '@/lib/hooks/use-business-features';
import { db } from '@/lib/db/dexie';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import type { UnitType, BusinessType } from '@/lib/types';
import { createTenantResource } from '@/lib/api/tenant';
import { syncTenantDataFromApi } from '@/lib/services/sync-from-api';
import { TANZANIA_MEDICINE_TEMPLATES, type MedicineTemplate } from '@/lib/config/medicine-templates';

const unitOptions: { value: UnitType; label: string; group: string }[] = [
  { value: 'piece', label: 'Piece (pcs)', group: 'General' },
  { value: 'box', label: 'Box', group: 'General' },
  { value: 'pack', label: 'Pack', group: 'General' },
  { value: 'dozen', label: 'Dozen (dz)', group: 'General' },
  
  // Pharmacy Specific
  { value: 'strip', label: 'Strip', group: 'Pharmacy' },
  { value: 'bottle', label: 'Bottle', group: 'Pharmacy' },
  { value: 'vial', label: 'Vial', group: 'Pharmacy' },
  { value: 'ampoule', label: 'Ampoule', group: 'Pharmacy' },
  { value: 'tube', label: 'Tube', group: 'Pharmacy' },
  { value: 'sachet', label: 'Sachet', group: 'Pharmacy' },
  { value: 'tin', label: 'Tin', group: 'Pharmacy' },

  { value: 'kg', label: 'Kilogram (kg)', group: 'Weight' },
  { value: 'g', label: 'Gram (g)', group: 'Weight' },
  { value: 'liter', label: 'Liter (L)', group: 'Volume' },
  { value: 'ml', label: 'Milliliter (ml)', group: 'Volume' },
  { value: 'meter', label: 'Meter (m)', group: 'Length' },
  { value: 'cm', label: 'Centimeter (cm)', group: 'Length' },
];

function genSKU(name: string) {
  const prefix = name.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'PRD';
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${rand}`;
}

function genBarcode() {
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return [...digits, check].join('');
}

export default function NewProductPage() {
  const router = useRouter();
  const { company, token } = useAuthStore();
  const features = useBusinessFeatures();
  const currency = company?.currencySymbol || 'TSH';
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.categories.where('companyId').equals(company.id).toArray();
    },
    [company?.id], []
  );

  const [form, setForm] = useState({
    name: '',
    sku: genSKU(''),
    barcode: genBarcode(),
    description: '',
    categoryId: '',
    costPrice: '' as string | number,
    sellingPrice: '' as string | number,
    taxRate: 0,
    quantity: '' as string | number,
    minStock: 10,
    unit: 'piece' as UnitType,
    allowDecimalQuantity: false,
    
    // Pharmacy specific
    genericName: '',
    brandName: '',
    dosage: '',
    form: '',
    requiresPrescription: false,
    unitsPerPack: 1,
    
    // Initial batch
    expiryDate: '',
    batchNumber: '',
    
    isActive: true,
  });

  const [batches, setBatches] = useState<{id: string, batchNumber: string, expiryDate: string, quantity: number}[]>([]);

  const isPharmacy = features.businessTypes.includes('pharmacy');

  // Set first category once loaded
  useEffect(() => {
    if (categories && categories.length > 0 && !form.categoryId) {
      setForm(f => ({ ...f, categoryId: categories[0].id }));
    }
  }, [categories]);

  const set = useCallback((key: string, value: unknown) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Auto-regenerate SKU when name changes
      if (key === 'name') next.sku = genSKU(value as string);
      return next;
    });
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }, []);

  // Infer business type from selected category
  const inferBusinessType = (): BusinessType | undefined => {
    const cat = categories?.find(c => c.id === form.categoryId);
    if (cat) {
      const suffix = cat.name.match(/\((\w+)\)$/)?.[1]?.toLowerCase();
      if (suffix && ['retail', 'pharmacy', 'building', 'wholesale'].includes(suffix)) {
        return suffix as BusinessType;
      }
      if (cat.parentId) {
        const parent = categories?.find(c => c.id === cat.parentId);
        if (parent) {
          const pSuffix = parent.name.match(/\((\w+)\)$/)?.[1]?.toLowerCase();
          if (pSuffix && ['retail', 'pharmacy', 'building', 'wholesale'].includes(pSuffix)) {
            return pSuffix as BusinessType;
          }
        }
      }
    }
    // Fallback to company primary type
    const companyTypes = company?.types;
    if (companyTypes != null && companyTypes.length > 0) {
      return companyTypes[0] as BusinessType;
    }
    return undefined;
  };

  const addBatch = () => {
    setBatches([...batches, { id: uuid(), batchNumber: '', expiryDate: '', quantity: 0 }]);
  };

  const removeBatch = (id: string) => {
    setBatches(batches.filter(b => b.id !== id));
  };

  const updateBatch = (id: string, key: string, value: any) => {
    setBatches(batches.map(b => b.id === id ? { ...b, [key]: value } : b));
  };

  const applyTemplate = async (template: MedicineTemplate) => {
    if (!company?.id) return;

    try {
      // 1. Find or create category
      // For pharmacy: categories have suffix like "CategoryName (PHARMACY)"
      let categoryId = categories?.find(c => {
        const upperName = c.name.toUpperCase();
        const templateNameUpper = template.categoryName.toUpperCase();
        if (isPharmacy) {
          return upperName.includes(templateNameUpper) && upperName.includes('(PHARMACY)');
        }
        return upperName.includes(templateNameUpper);
      })?.id;
      
      if (!categoryId) {
        const newCatId = uuid();
        try {
          const categoryName = isPharmacy 
            ? `${template.categoryName} (PHARMACY)`
            : template.categoryName;
          await db.categories.add({
            id: newCatId,
            name: categoryName,
            companyId: company.id,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            sortOrder: 0
          });
          categoryId = newCatId;
        } catch (dbError) {
          console.error("Local DB error creating category:", dbError);
        }
      }

      // 2. Update form state
      const brandName = template.name.split(' (')[0];
      setForm(prev => ({
        ...prev,
        name: template.name,
        brandName: brandName,
        genericName: template.genericName,
        categoryId: categoryId || prev.categoryId,
        dosage: template.dosage,
        form: template.form,
        unit: template.unit as UnitType,
        unitsPerPack: template.unitsPerPack,
        requiresPrescription: template.requiresPrescription,
        sku: genSKU(template.name)
      }));

      toast.success(`Applied template for ${template.name}`, {
        description: "Category and medical details auto-filled."
      });
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error("Failed to apply medicine details.");
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!form.categoryId) e.categoryId = 'Category is required';
    if (Number(form.sellingPrice) < 0) e.sellingPrice = 'Must be 0 or more';
    if (Number(form.costPrice) < 0) e.costPrice = 'Must be 0 or more';
    
    if (isPharmacy && batches.length > 0) {
      batches.forEach((b, i) => {
        if (!b.batchNumber) e[`batch_${i}_num`] = 'Required';
        if (!b.expiryDate) e[`batch_${i}_exp`] = 'Required';
      });
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fix the errors before saving'); return; }
    setSaving(true);
    try {
      if (!token) throw new Error('Session expired');
      
      const productId = uuid();
      
      const businessType = inferBusinessType();
      
      // 1. Create the Product
      await createTenantResource('products', {
        id: productId,
        category_id: form.categoryId,
        sku: form.sku,
        name: form.name,
        unit: form.unit,
        cost_price: Number(form.costPrice) || 0,
        selling_price: Number(form.sellingPrice) || 0,
        tax_rate: Number(form.taxRate) || 0,
        quantity: Number(form.quantity) || 0,
        min_stock: form.minStock,
        is_active: form.isActive,
        business_type: businessType,
        
        // Pharmacy extensions
        generic_name: form.genericName || undefined,
        brand_name: form.brandName || undefined,
        dosage: form.dosage || undefined,
        form: form.form || undefined,
        requires_prescription: form.requiresPrescription,
        units_per_pack: Number(form.unitsPerPack) || 1,
      }, token);

      // 2. Create Batches if any
      if (isPharmacy && batches.length > 0) {
        for (const b of batches) {
          await createTenantResource('product_batches', {
            id: b.id,
            product_id: productId,
            batch_number: b.batchNumber,
            expiry_date: new Date(b.expiryDate).toISOString(),
            quantity: Number(b.quantity) || 0,
          }, token);
        }
      } else if (isPharmacy && form.batchNumber && form.expiryDate) {
        // Handle single batch from the initial fields
        await createTenantResource('product_batches', {
          id: uuid(),
          product_id: productId,
          batch_number: form.batchNumber,
          expiry_date: new Date(form.expiryDate).toISOString(),
          quantity: Number(form.quantity) || 0,
        }, token);
      }

      await syncTenantDataFromApi(token);
      toast.success('Product added successfully!', {
        description: `${form.name} · SKU: ${form.sku}`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      });
      router.push('/dashboard/inventory');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cost = Number(form.costPrice) || 0;
  const sell = Number(form.sellingPrice) || 0;
  const margin = sell - cost;
  const marginPct = cost > 0 ? ((margin / cost) * 100).toFixed(1) : null;

  const parentCats = (categories || []).filter(c => !c.parentId);
  const childCats = (categories || []).filter(c => c.parentId);

  const filteredUnits = unitOptions.filter(u => {
    if (['kg', 'g'].includes(u.value) && !features.supportsWeightUnit) return false;
    if (['meter', 'cm'].includes(u.value) && !features.supportsLengthUnit) return false;
    if (['liter', 'ml'].includes(u.value) && !features.supportsVolumeUnit) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-muted/20">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/dashboard/inventory"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold leading-tight">Add New Product</h1>
            <p className="text-xs text-muted-foreground">Fill in the details below to add to inventory</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/inventory">Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[120px]">
            {saving ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>
            ) : (
              <><Save className="h-4 w-4" />Add Product</>
            )}
          </Button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-4xl px-6 py-6 space-y-5">

        {/* ══ PHARMACY TEMPLATE SELECTION ══ */}
        {isPharmacy && (
          <Card className="border-primary bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-primary uppercase tracking-widest">
                <Sparkles className="h-4 w-4" />
                Quick-Add Medicine Template (Tanzania)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select onValueChange={(v) => {
                  if (v === 'custom') return;
                  const template = TANZANIA_MEDICINE_TEMPLATES.find(t => t.name === v);
                  if (template) applyTemplate(template);
                }}>
                  <SelectTrigger className="flex-1 h-12 text-base border-primary/30 bg-background">
                    <SelectValue placeholder="Search or select from 25+ common medicines..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="custom" className="font-bold text-primary">
                      + Create Custom Medicine (Not in list)
                    </SelectItem>
                    <Separator className="my-1" />
                    {TANZANIA_MEDICINE_TEMPLATES.map(t => (
                      <SelectItem key={t.name} value={t.name}>
                        {t.name} <span className="text-[10px] text-muted-foreground ml-2">({t.genericName})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-background px-3 py-2 rounded-lg border border-primary/10">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  Selecting a template auto-fills Category, Generic Name, Dosage, and Form.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══ BASIC INFORMATION ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Name — full width */}
            <FormField label="Product Name" required error={errors.name}>
              <Input
                placeholder="e.g. iPhone Case, Portland Cement 50kg, Paracetamol 500mg"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className={`text-base ${errors.name ? 'border-destructive' : ''}`}
                autoFocus
              />
            </FormField>

            {/* SKU + Barcode */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="SKU" required error={errors.sku}
                hint="Auto-generated · editable">
                <div className="flex gap-2">
                  <Input
                    value={form.sku}
                    onChange={e => set('sku', e.target.value)}
                    placeholder="PRD-XXXXX"
                    className={`font-mono ${errors.sku ? 'border-destructive' : ''}`}
                  />
                  <Button type="button" variant="outline" size="icon" className="shrink-0"
                    onClick={() => set('sku', genSKU(form.name))}
                    title="Regenerate SKU">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </FormField>

              <FormField label="Barcode (EAN-13)" hint="Auto-generated · editable">
                <div className="flex gap-2">
                  <Input
                    value={form.barcode}
                    onChange={e => set('barcode', e.target.value)}
                    placeholder="1234567890123"
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" size="icon" className="shrink-0"
                    onClick={() => set('barcode', genBarcode())}
                    title="Regenerate barcode">
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
              </FormField>
            </div>

            {/* Category */}
            <FormField label="Category" required error={errors.categoryId}>
              <Select value={form.categoryId} onValueChange={v => set('categoryId', v)}>
                <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {parentCats.map(cat => (
                    <div key={cat.id}>
                      <SelectItem value={cat.id} className="font-semibold">{cat.name}</SelectItem>
                      {childCats.filter(c => c.parentId === cat.id).map(child => (
                        <SelectItem key={child.id} value={child.id} className="pl-6 text-muted-foreground">
                          ↳ {child.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Description */}
            <FormField label="Description" hint="Optional — product notes, specs, or details">
              <Textarea
                placeholder="Enter product description, specifications, or any relevant notes..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* ══ PRICING ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Banknote className="h-4 w-4 text-green-700 dark:text-green-400" />
              </div>
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={`Cost Price (${currency})`} required error={errors.costPrice}
                hint="Purchase price from supplier">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    {currency}
                  </span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.costPrice}
                    onChange={e => set('costPrice', e.target.value)}
                    className={`pl-8 ${errors.costPrice ? 'border-destructive' : ''}`}
                    placeholder="0.00"
                  />
                </div>
              </FormField>

              <FormField label={`Selling Price (${currency})`} required error={errors.sellingPrice}
                hint="Price charged to customers">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    {currency}
                  </span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.sellingPrice}
                    onChange={e => set('sellingPrice', e.target.value)}
                    className={`pl-8 ${errors.sellingPrice ? 'border-destructive' : ''}`}
                    placeholder="0.00"
                  />
                </div>
              </FormField>
              
              <FormField label={`Tax Rate (%)`} error={errors.taxRate}
                hint="Applicable tax percentage">
                <div className="relative">
                  <Input
                    type="number" min="0" max="100" step="0.01"
                    value={form.taxRate}
                    onChange={e => set('taxRate', e.target.value)}
                    className={`pr-8 ${errors.taxRate ? 'border-destructive' : ''}`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    %
                  </span>
                </div>
              </FormField>
            </div>

            {/* Margin display */}
            <div className={`flex items-center justify-between rounded-xl border px-5 py-3.5 ${
              margin > 0 ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
              : margin < 0 ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
              : 'bg-muted/50 border-border'
            }`}>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profit Margin</p>
                <p className={`text-xl font-bold mt-0.5 ${margin > 0 ? 'text-green-700 dark:text-green-400' : margin < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {currency}{margin.toFixed(2)}
                </p>
              </div>
              {marginPct && (
                <Badge className={`text-sm px-3 py-1 ${
                  margin > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-800'
                }`}>
                  {marginPct}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ══ STOCK & UNITS ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Layers className="h-4 w-4 text-orange-700 dark:text-orange-400" />
              </div>
              Stock & Units
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Initial Quantity" error={errors.quantity}>
                <Input
                  type="number" step={form.allowDecimalQuantity ? "0.01" : "1"}
                  value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Unit of Measure">
                <Select value={form.unit} onValueChange={v => set('unit', v)}>
                  <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(unitOptions.map(u => u.group))).map(group => (
                      <div key={group}>
                        <div className="px-2 py-1.5 text-[10px] font-black uppercase text-muted-foreground bg-muted/30">{group}</div>
                        {unitOptions.filter(u => u.group === group).map(u => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {isPharmacy && ["strip", "box", "pack", "bottle", "tin"].includes(form.unit) && (
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-primary">Unit Conversion (Internal Breakdown)</Label>
                    <p className="text-[11px] text-muted-foreground">How many {form.form || 'units'} are inside one {form.unit}?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" min="1"
                      value={form.unitsPerPack}
                      onChange={e => set("unitsPerPack", parseInt(e.target.value) || 1)}
                      className="w-24 h-10 text-center font-black bg-background border-primary/20"
                    />
                    <span className="text-xs font-bold text-muted-foreground uppercase">Units</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-primary/70 italic bg-background/50 px-4 py-2 rounded-lg border border-primary/5">
                  <Info className="h-4 w-4" />
                  Example: 1 {form.unit} = {form.unitsPerPack} {form.form || 'units'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Low Stock Alert" hint="Alert when below this number">
                <Input
                  type="number"
                  value={form.minStock}
                  onChange={e => set('minStock', Number(e.target.value))}
                />
              </FormField>
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 h-[42px] mt-auto">
                <div className="flex flex-col">
                  <p className="text-xs font-bold uppercase tracking-tighter">Decimal Qty</p>
                </div>
                <Switch
                  checked={form.allowDecimalQuantity}
                  onCheckedChange={v => set('allowDecimalQuantity', v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══ PHARMACY DETAILS (Conditional) ══ */}
        {isPharmacy && (
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="pb-3 bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-base text-primary">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Pill className="h-4 w-4 text-primary" />
                </div>
                Pharmacy & Medicine Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Generic Name" hint="e.g. Paracetamol">
                  <Input
                    placeholder="Enter generic name..."
                    value={form.genericName}
                    onChange={e => set('genericName', e.target.value)}
                  />
                </FormField>
                <FormField label="Brand Name" hint="e.g. Panadol">
                  <Input
                    placeholder="Enter brand name..."
                    value={form.brandName}
                    onChange={e => set('brandName', e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Dosage" hint="e.g. 500mg, 5ml">
                  <Input
                    placeholder="Enter dosage..."
                    value={form.dosage}
                    onChange={e => set('dosage', e.target.value)}
                  />
                </FormField>
                <FormField label="Form" hint="e.g. Tablet, Syrup">
                  <Select value={form.form} onValueChange={v => set('form', v)}>
                    <SelectTrigger><SelectValue placeholder="Select form..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="capsule">Capsule</SelectItem>
                      <SelectItem value="syrup">Syrup</SelectItem>
                      <SelectItem value="injection">Injection</SelectItem>
                      <SelectItem value="cream">Cream/Ointment</SelectItem>
                      <SelectItem value="drops">Drops</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="flex items-center justify-between rounded-xl border bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Requires Prescription</p>
                    <p className="text-xs text-muted-foreground">Force prescription check at POS</p>
                  </div>
                </div>
                <Switch
                  checked={form.requiresPrescription}
                  onCheckedChange={v => set('requiresPrescription', v)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══ BATCH & EXPIRY (pharmacy only) ══ */}
        {features.hasExpiryTracking && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <FlaskConical className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                </div>
                Batch & Expiry Management
              </CardTitle>
              {isPharmacy && (
                <Button type="button" variant="outline" size="sm" onClick={addBatch} className="gap-2">
                  <Plus className="h-3.5 w-3.5" /> Add Multiple Batches
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Single Batch (Legacy/Simple Mode) */}
              {batches.length === 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Batch Number" error={errors.batchNumber}>
                    <Input
                      value={form.batchNumber}
                      onChange={e => set('batchNumber', e.target.value)}
                      placeholder="e.g. BNT-1001"
                    />
                  </FormField>
                  <FormField label="Expiry Date" error={errors.expiryDate}>
                    <Input
                      type="date"
                      value={form.expiryDate}
                      onChange={e => set('expiryDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormField>
                </div>
              ) : (
                /* Multiple Batches Mode */
                <div className="space-y-4">
                  {batches.map((batch, index) => (
                    <div key={batch.id} className="relative grid grid-cols-1 gap-3 sm:grid-cols-3 p-4 border rounded-xl bg-muted/30">
                      <FormField label="Batch #" error={errors[`batch_${index}_num`]}>
                        <Input
                          value={batch.batchNumber}
                          onChange={e => updateBatch(batch.id, 'batchNumber', e.target.value)}
                          placeholder="Batch ID"
                        />
                      </FormField>
                      <FormField label="Expiry Date" error={errors[`batch_${index}_exp`]}>
                        <Input
                          type="date"
                          value={batch.expiryDate}
                          onChange={e => updateBatch(batch.id, 'expiryDate', e.target.value)}
                        />
                      </FormField>
                      <div className="flex items-end gap-2">
                        <FormField label="Qty" className="flex-1">
                          <Input
                            type="number" min="0"
                            value={batch.quantity}
                            onChange={e => updateBatch(batch.id, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </FormField>
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="text-destructive h-10 w-10"
                          onClick={() => removeBatch(batch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══ STATUS ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <ToggleRight className="h-4 w-4 text-muted-foreground" />
              </div>
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Active Product</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inactive products are hidden from POS and won't appear in sales
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${form.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={v => set('isActive', v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Bottom save bar ── */}
        <div className="flex gap-3 pb-8">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/dashboard/inventory">Cancel</Link>
          </Button>
          <Button className="flex-1 gap-2 h-12 text-base" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>
            ) : (
              <><Save className="h-4 w-4" />Add Product</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Helper ── */
function FormField({
  label, required, hint, error, children,
}: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

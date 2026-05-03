"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useBusinessFeatures } from "@/lib/hooks/use-business-features"
import { db } from "@/lib/db/dexie"
import { toast } from "sonner"
import {
  RefreshCw, Barcode, Package, Banknote,
  Layers, FlaskConical, ToggleRight, Sparkles,
  Pill, AlertCircle, Plus, Trash2, Info,
} from "lucide-react"
import type { Product, Category, UnitType } from "@/lib/types"
import { TANZANIA_MEDICINE_TEMPLATES, type MedicineTemplate } from "@/lib/config/medicine-templates"
import { v4 as uuid } from "uuid"
import { createTenantResource } from "@/lib/api/tenant"
import { syncTenantDataFromApi } from "@/lib/services/sync-from-api"

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  categories: Category[]
  onSave: (product: Partial<Product>) => void
}

const unitOptions: { value: UnitType; label: string; group: string }[] = [
  { value: "piece", label: "Piece (pcs)", group: "General" },
  { value: "box", label: "Box", group: "General" },
  { value: "pack", label: "Pack", group: "General" },
  { value: "dozen", label: "Dozen (dz)", group: "General" },
  
  // Pharmacy Specific
  { value: "strip", label: "Strip", group: "Pharmacy" },
  { value: "bottle", label: "Bottle", group: "Pharmacy" },
  { value: "vial", label: "Vial", group: "Pharmacy" },
  { value: "ampoule", label: "Ampoule", group: "Pharmacy" },
  { value: "tube", label: "Tube", group: "Pharmacy" },
  { value: "sachet", label: "Sachet", group: "Pharmacy" },
  { value: "tin", label: "Tin", group: "Pharmacy" },

  { value: "kg", label: "Kilogram (kg)", group: "Weight" },
  { value: "g", label: "Gram (g)", group: "Weight" },
  { value: "ton", label: "Ton", group: "Weight" },
  { value: "tan", label: "Tan", group: "Weight" },
  { value: "liter", label: "Liter (L)", group: "Volume" },
  { value: "ml", label: "Milliliter (ml)", group: "Volume" },
  { value: "meter", label: "Meter (m)", group: "Length" },
  { value: "cm", label: "Centimeter (cm)", group: "Length" },
]

// Auto-generate SKU: PREFIX-XXXXX
function genSKU(name: string) {
  const prefix = name.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "PRD"
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}-${rand}`
}

// Auto-generate EAN-13 style barcode
function genBarcode() {
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10))
  // Calculate check digit
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0)
  const check = (10 - (sum % 10)) % 10
  return [...digits, check].join("")
}

const EMPTY_FORM = {
  name: "", sku: "", barcode: "", description: "", categoryId: "",
  costPrice: "" as string | number,
  sellingPrice: "" as string | number,
  taxRate: 0,
  taxType: 'percentage' as 'percentage' | 'fixed',
  quantity: "" as string | number,
  minStock: 10,
  unit: "piece" as UnitType,
  allowDecimalQuantity: false,
  
  // Pharmacy specific
  genericName: "",
  brandName: "",
  dosage: "",
  form: "",
  requiresPrescription: false,
  unitsPerPack: 1,
  
  // Initial batch
  expiryDate: "", batchNumber: "",
  
  isActive: true,
}

export function ProductForm({ open, onOpenChange, product, categories: initialCategories, onSave }: ProductFormProps) {
  const { company, token } = useAuthStore()
  const features = useBusinessFeatures()
  const currency = company?.currencySymbol || "Tsh"
  const isEditing = !!product

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [batches, setBatches] = useState<{id: string, batchNumber: string, expiryDate: string, quantity: number}[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !company?.id || !token) return
    
    try {
      const newCat: Category = {
        id: uuid(),
        name: newCategoryName.trim(),
        companyId: company.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sortOrder: 0
      }
      
      // 1. Save to API
      await createTenantResource("categories", newCat, token)
      
      // 2. Save to Local DB
      await db.categories.add(newCat)
      
      // 3. Update local state
      setCategories(prev => [...prev, newCat])
      setForm(prev => ({ ...prev, categoryId: newCat.id }))
      
      // 4. Reset state
      setNewCategoryName("")
      setIsCreatingCategory(false)
      toast.success(`Category "${newCategoryName}" created successfully`)
    } catch (error) {
      console.error("Error creating category:", error)
      toast.error("Failed to create category")
    }
  }

  const isPharmacy = features.businessTypes.includes('pharmacy');

  // Initialise / reset form when dialog opens
  useEffect(() => {
    if (!open) return
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || "",
        description: product.description || "",
        categoryId: product.categoryId,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        taxRate: product.taxRate ?? 0,
        taxType: (product as any).taxType || 'percentage',
        quantity: product.quantity,
        minStock: product.minStock ?? 10,
        unit: product.unit,
        allowDecimalQuantity: product.allowDecimalQuantity ?? false,
        
        // Pharmacy specific
        genericName: product.genericName || "",
        brandName: product.brandName || "",
        dosage: product.dosage || "",
        form: product.form || "",
        requiresPrescription: product.requiresPrescription ?? false,
        unitsPerPack: product.unitsPerPack ?? 1,
        
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split("T")[0] : "",
        batchNumber: product.batchNumber || "",
        isActive: product.isActive,
      })
      
      // Load batches if any
      if (product.id) {
        db.productBatches.where('productId').equals(product.id).toArray()
          .then(res => {
            setBatches(res.map(b => ({
              id: b.id,
              batchNumber: b.batchNumber,
              expiryDate: new Date(b.expiryDate).toISOString().split("T")[0],
              quantity: b.quantity
            })))
          })
      }
    } else {
      const sku = genSKU("")
      const barcode = genBarcode()
      setForm({
        ...EMPTY_FORM,
        sku,
        barcode,
        categoryId: categories[0]?.id || "",
      })
      setBatches([])
    }
    setErrors({})
  }, [open, product])

  // Keep category selection valid without resetting user-entered fields.
  useEffect(() => {
    if (!open || isEditing) return
    setForm(prev => {
      if (prev.categoryId) return prev
      if (!categories.length) return prev
      return { ...prev, categoryId: categories[0].id }
    })
  }, [open, isEditing, categories])

  const addBatch = () => {
    setBatches([...batches, { id: Math.random().toString(36).substring(7), batchNumber: '', expiryDate: '', quantity: 0 }]);
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
      // 1. Find or create category LOCALLY in Dexie first
      // For pharmacy: categories have suffix like "CategoryName (PHARMACY)"
      // Try to find by matching the template categoryName with the business type suffix
      let categoryId = categories?.find(c => {
        const upperName = c.name.toUpperCase();
        const templateNameUpper = template.categoryName.toUpperCase();
        // Check if category name contains template name AND has pharmacy suffix if we're in pharmacy mode
        if (isPharmacy) {
          return upperName.includes(templateNameUpper) && upperName.includes('(PHARMACY)');
        }
        return upperName.includes(templateNameUpper);
      })?.id;
      
      if (!categoryId) {
        const newCatId = uuid();
        try {
          // Build category name with business type suffix for pharmacy
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

      // 2. Update form state with proper pharmacy UX mapping
      const brandName = template.name.split(' (')[0];
      setForm(prev => ({
        ...prev,
        name: template.name, // Full name for display
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

  // Auto-regenerate SKU when name changes (only for new products)
  const set = useCallback((key: string, value: unknown) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      // Auto-update SKU prefix when name changes on new product
      if (key === "name" && !isEditing) {
        next.sku = genSKU(value as string)
      }
      return next
    })
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }, [isEditing, errors])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Product name is required"
    if (!form.sku.trim()) e.sku = "SKU is required"
    if (!form.categoryId) e.categoryId = "Category is required"
    if (Number(form.sellingPrice) < 0) e.sellingPrice = "Must be 0 or more"
    if (Number(form.costPrice) < 0) e.costPrice = "Must be 0 or more"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) { toast.error("Please fix the errors before saving"); return }
    onSave({
      ...form,
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      taxRate: Number(form.taxRate) || 0,
      taxType: form.taxType,
      quantity: Number(form.quantity) || 0,
      expiryDate: form.expiryDate ? new Date(form.expiryDate) : undefined,
      barcode: form.barcode || undefined,
      description: form.description || undefined,
      batchNumber: form.batchNumber || undefined,
      // Add multiple batches to the save object
      batches: isPharmacy && batches.length > 0 ? batches.map(b => ({
        ...b,
        expiryDate: new Date(b.expiryDate)
      })) : undefined
    } as any)
    onOpenChange(false)
  }

  const cost = Number(form.costPrice) || 0
  const sell = Number(form.sellingPrice) || 0
  const margin = sell - cost
  const marginPct = cost > 0 ? ((margin / cost) * 100).toFixed(1) : "—"

  const filteredUnits = unitOptions.filter(u => {
    if (["kg", "g", "ton", "tan"].includes(u.value) && !features.supportsWeightUnit) return false
    if (["meter", "cm"].includes(u.value) && !features.supportsLengthUnit) return false
    if (["liter", "ml"].includes(u.value) && !features.supportsVolumeUnit) return false
    return true
  })

  // Group categories: parents first, then children indented
  const parentCats = categories.filter(c => !c.parentId)
  const childCats = categories.filter(c => c.parentId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-xl p-0 gap-0"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {isEditing ? "Edit Product" : "Add New Product"}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {isEditing ? `Editing: ${product?.name}` : "Fill in the details below"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Scrollable body ── */}
        <ScrollArea className="flex-1 min-h-0">
          <form id="product-form" onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-7">

              {/* ── SECTION: Quick Add (Pharmacy Only) ── */}
              {isPharmacy && !isEditing && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    Quick-Add Medicine Template
                  </div>
                  <Select onValueChange={(v) => {
                    const template = TANZANIA_MEDICINE_TEMPLATES.find(t => t.name === v);
                    if (template) applyTemplate(template);
                  }}>
                    <SelectTrigger className="h-10 text-sm bg-background border-primary/20">
                      <SelectValue placeholder="Select from 25+ Tanzanian medicines..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TANZANIA_MEDICINE_TEMPLATES.map(t => (
                        <SelectItem key={t.name} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Fills Category, Generic Name, Dosage, and Form automatically.
                  </p>
                </div>
              )}

              {/* ── SECTION: Basic Info ── */}
              <section className="space-y-4">
                <SectionTitle icon={Package} label="Basic Information" />

                {/* Product Name */}
                <Field label="Product Name" required error={errors.name}>
                  <Input
                    placeholder="e.g. Paracetamol 500mg, Portland Cement 50kg"
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    className={errors.name ? "border-destructive" : ""}
                    autoFocus
                  />
                </Field>

                {/* SKU + Barcode row */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="SKU" required error={errors.sku}
                    hint="Auto-generated from name">
                    <div className="flex gap-1.5">
                      <Input
                        value={form.sku}
                        onChange={e => set("sku", e.target.value)}
                        placeholder="PRD-XXXXX"
                        className={`font-mono text-sm ${errors.sku ? "border-destructive" : ""}`}
                      />
                      <Button
                        type="button" variant="outline" size="icon" className="shrink-0 h-9 w-9"
                        onClick={() => set("sku", genSKU(form.name))}
                        title="Regenerate SKU"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Field>

                  <Field label="Barcode" hint="Auto-generated EAN-13">
                    <div className="flex gap-1.5">
                      <Input
                        value={form.barcode}
                        onChange={e => set("barcode", e.target.value)}
                        placeholder="1234567890123"
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button" variant="outline" size="icon" className="shrink-0 h-9 w-9"
                        onClick={() => set("barcode", genBarcode())}
                        title="Regenerate barcode"
                      >
                        <Barcode className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Field>
                </div>

                {/* Category */}
                <Field label="Category" required error={errors.categoryId}>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={form.categoryId}
                          onValueChange={v => set("categoryId", v)}
                        >
                          <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {parentCats.map(cat => (
                              <div key={cat.id}>
                                <SelectItem value={cat.id} className="font-semibold">
                                  {cat.name}
                                </SelectItem>
                                {childCats.filter(c => c.parentId === cat.id).map(child => (
                                  <SelectItem key={child.id} value={child.id} className="pl-6 text-muted-foreground">
                                    ↳ {child.name}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                            {/* Orphan children (no parent in list) */}
                            {childCats.filter(c => !parentCats.find(p => p.id === c.parentId)).map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0"
                        onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                        title="Add New Category"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {isCreatingCategory && (
                      <div className="flex gap-2 p-3 bg-muted/50 rounded-xl border border-dashed border-primary/20 animate-in fade-in slide-in-from-top-2">
                        <Input 
                          placeholder="New category name..." 
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="h-9 text-sm bg-background"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleCreateCategory()
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          size="sm" 
                          className="h-9 font-bold"
                          onClick={handleCreateCategory}
                        >
                          Save
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-9"
                          onClick={() => setIsCreatingCategory(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </Field>

                {/* Description */}
                <Field label="Description">
                  <Textarea
                    placeholder="Optional product description, notes, or specifications..."
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </Field>
              </section>

              <Separator />

              {/* ── SECTION: Pricing ── */}
              <section className="space-y-4">
                <SectionTitle icon={Banknote} label="Pricing" />

                <div className="grid grid-cols-2 gap-3">
                  <Field label={`Cost Price (${currency})`} required error={errors.costPrice}
                    hint="What you pay the supplier">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                        {currency}
                      </span>
                      <Input
                        type="number" min="0" step="0.01"
                        value={form.costPrice}
                        onChange={e => set("costPrice", e.target.value)}
                        className={`pl-7 ${errors.costPrice ? "border-destructive" : ""}`}
                        placeholder="0.00"
                      />
                    </div>
                  </Field>

                  <Field label={`Selling Price (${currency})`} required error={errors.sellingPrice}
                    hint="What customers pay">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                        {currency}
                      </span>
                      <Input
                        type="number" min="0" step="0.01"
                        value={form.sellingPrice}
                        onChange={e => set("sellingPrice", e.target.value)}
                        className={`pl-7 ${errors.sellingPrice ? "border-destructive" : ""}`}
                        placeholder="0.00"
                      />
                    </div>
                  </Field>
                  
                  <Field label={`Tax Rate`} error={errors.taxRate}
                    hint="Applicable tax value">
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full flex items-center">
                        <button
                          type="button"
                          onClick={() => set("taxType", form.taxType === 'percentage' ? 'fixed' : 'percentage')}
                          className="h-full px-3 border-r bg-muted hover:bg-muted/80 text-[10px] font-bold transition-colors rounded-l-md"
                        >
                          {form.taxType === 'percentage' ? '%' : currency}
                        </button>
                      </div>
                      <Input
                        type="number" min="0" max={form.taxType === 'percentage' ? 100 : 1000000} step="0.01"
                        value={form.taxRate}
                        onChange={e => set("taxRate", e.target.value)}
                        className={`pl-14 ${errors.taxRate ? "border-destructive" : ""}`}
                        placeholder="0"
                      />
                    </div>
                  </Field>
                </div>

                {/* Margin indicator */}
                <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm border ${
                  margin > 0 ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                  : margin < 0 ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                  : "bg-muted border-border"
                }`}>
                  <span className="text-muted-foreground font-medium">Profit Margin</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-base ${margin > 0 ? "text-green-700 dark:text-green-400" : margin < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                      {currency}{margin.toFixed(2)}
                    </span>
                    {cost > 0 && (
                      <Badge variant="secondary" className={`text-xs ${margin > 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800"}`}>
                        {marginPct}%
                      </Badge>
                    )}
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── SECTION: Stock & Units ── */}
              <section className="space-y-4">
                <SectionTitle icon={Layers} label="Stock & Units" />
                
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Current Stock" error={errors.quantity}>
                    <Input
                      type="number" step={form.allowDecimalQuantity ? "0.01" : "1"}
                      value={form.quantity}
                      onChange={e => set("quantity", e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Unit of Measure">
                    <Select value={form.unit} onValueChange={v => set("unit", v as UnitType)}>
                      <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(filteredUnits.map(u => u.group))).map(group => (
                          <div key={group}>
                            <div className="px-2 py-1.5 text-[10px] font-black uppercase text-muted-foreground bg-muted/30">{group}</div>
                            {filteredUnits.filter(u => u.group === group).map(u => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {isPharmacy && ["strip", "box", "pack", "bottle", "tin"].includes(form.unit) && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-primary">Unit Conversion (Internal Breakdown)</Label>
                        <p className="text-[10px] text-muted-foreground">How many units are inside one {form.unit}?</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number" min="1"
                          value={form.unitsPerPack}
                          onChange={e => set("unitsPerPack", parseInt(e.target.value) || 1)}
                          className="w-20 h-9 text-center font-black bg-background border-primary/20"
                        />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Units</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-primary/70 italic bg-background/50 px-3 py-1.5 rounded-lg border border-primary/5">
                      <Info className="h-3 w-3" />
                      Example: 1 {form.unit} = {form.unitsPerPack} {form.form || 'units'}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Minimum Stock" hint="Alert threshold">
                    <Input
                      type="number"
                      value={form.minStock}
                      onChange={e => set("minStock", Number(e.target.value))}
                    />
                  </Field>
                  <div className="flex flex-col justify-end pb-1">
                    <SwitchRow
                      label="Decimal Qty"
                      description="Allow 0.5, 2.5 etc"
                      checked={form.allowDecimalQuantity}
                      onChange={v => set("allowDecimalQuantity", v)}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── SECTION: Pharmacy Details (Conditional) ── */}
              {isPharmacy && (
                <>
                  <section className="space-y-4 p-4 rounded-xl border bg-primary/5 border-primary/20 shadow-inner">
                    <div className="flex items-center justify-between">
                      <SectionTitle icon={Pill} label="Medicine Identity" />
                      <Badge variant="outline" className="bg-background text-[10px] font-black uppercase">Pharmacy Mode</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Generic Name" hint="Scientific active ingredient">
                        <Input
                          placeholder="e.g. Paracetamol"
                          value={form.genericName}
                          onChange={e => set("genericName", e.target.value)}
                          className="bg-background"
                        />
                      </Field>
                      <Field label="Brand Name" hint="Commercial name">
                        <Input
                          placeholder="e.g. Panadol"
                          value={form.brandName}
                          onChange={e => set("brandName", e.target.value)}
                          className="bg-background"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Dosage">
                        <Input
                          placeholder="500mg"
                          value={form.dosage}
                          onChange={e => set("dosage", e.target.value)}
                          className="bg-background text-center"
                        />
                      </Field>
                      <Field label="Form">
                        <Select value={form.form} onValueChange={v => set("form", v)}>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Form" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tablet">Tablet</SelectItem>
                            <SelectItem value="capsule">Capsule</SelectItem>
                            <SelectItem value="syrup">Syrup</SelectItem>
                            <SelectItem value="injection">Injection</SelectItem>
                            <SelectItem value="cream">Cream</SelectItem>
                            <SelectItem value="drops">Drops</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <div className="pt-2">
                      <SwitchRow
                        label="Requires Prescription"
                        description="Customer must provide a valid doctor's prescription"
                        checked={form.requiresPrescription}
                        onChange={v => set("requiresPrescription", v)}
                      />
                    </div>
                  </section>
                  <Separator />
                </>
              )}

              {/* ── SECTION: Batch & Expiry Management ── */}
              {features.hasExpiryTracking && (
                <>
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <SectionTitle icon={FlaskConical} label="Stock Batches" />
                        <p className="text-[10px] text-muted-foreground">Manage first-expiry-first-out (FEFO) stock</p>
                      </div>
                      {isPharmacy && (
                        <Button type="button" variant="outline" size="sm" onClick={addBatch} className="h-8 text-[11px] font-black uppercase tracking-tighter bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700">
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Batch
                        </Button>
                      )}
                    </div>

                    {batches.length === 0 ? (
                      <div className="grid grid-cols-2 gap-3 p-4 border rounded-xl bg-muted/10 border-dashed">
                        <Field label="Batch Number">
                          <Input
                            value={form.batchNumber}
                            onChange={e => set("batchNumber", e.target.value)}
                            placeholder="e.g. BNT-2024"
                          />
                        </Field>
                        <Field label="Expiry Date">
                          <Input
                            type="date"
                            value={form.expiryDate}
                            onChange={e => set("expiryDate", e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </Field>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                        {batches.map((batch, index) => (
                          <div key={batch.id} className="flex gap-2 p-3 border rounded-xl bg-background shadow-sm items-start relative group hover:border-primary/30 transition-colors">
                            <div className="grid grid-cols-11 gap-2 flex-1">
                              <div className="col-span-4 space-y-1">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Batch ID</Label>
                                <Input
                                  value={batch.batchNumber}
                                  onChange={e => updateBatch(batch.id, 'batchNumber', e.target.value)}
                                  className="h-9 text-xs font-bold"
                                  placeholder="Batch #"
                                />
                              </div>
                              <div className="col-span-4 space-y-1">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Expiry</Label>
                                <Input
                                  type="date"
                                  value={batch.expiryDate}
                                  onChange={e => updateBatch(batch.id, 'expiryDate', e.target.value)}
                                  className="h-9 text-xs"
                                />
                              </div>
                              <div className="col-span-3 space-y-1">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Stock Qty</Label>
                                <Input
                                  type="number" min="0"
                                  value={batch.quantity}
                                  onChange={e => updateBatch(batch.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="h-9 text-xs font-black text-primary"
                                />
                              </div>
                            </div>
                            <Button
                              type="button" variant="ghost" size="icon"
                              className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0 mt-5"
                              onClick={() => removeBatch(batch.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                  <Separator />
                </>
              )}

              {/* ── SECTION: Status ── */}
              <section className="space-y-4">
                <SectionTitle icon={ToggleRight} label="Status" />
                <SwitchRow
                  label="Active Product"
                  description="Inactive products are hidden from POS and won't appear in sales"
                  checked={form.isActive}
                  onChange={v => set("isActive", v)}
                  activeLabel="Active"
                  inactiveLabel="Inactive"
                />
              </section>

              {/* Bottom padding */}
              <div className="h-2" />
            </div>
          </form>
        </ScrollArea>

        {/* ── Footer actions ── */}
        <div className="border-t px-6 py-4 shrink-0 bg-background">
          <div className="flex gap-3">
            <Button
              type="button" variant="outline" className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit" form="product-form"
              className="flex-1 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isEditing ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ── Helper sub-components ── */

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{label}</h3>
    </div>
  )
}

function Field({
  label, required, hint, error, children,
}: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
    </div>
  )
}

function SwitchRow({
  label, description, checked, onChange, activeLabel, inactiveLabel,
}: {
  label: string; description: string; checked: boolean
  onChange: (v: boolean) => void; activeLabel?: string; inactiveLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {(activeLabel || inactiveLabel) && (
          <span className={`text-xs font-medium ${checked ? "text-green-600" : "text-muted-foreground"}`}>
            {checked ? activeLabel : inactiveLabel}
          </span>
        )}
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  )
}

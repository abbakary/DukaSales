'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Pill, HardHat, Warehouse,
  User, Mail, Lock, Eye, EyeOff, CheckCircle2,
  Store, Globe, Phone, CreditCard, Save,
  Upload, Camera, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { BusinessType } from '@/lib/types';
import { useRef } from 'react';
import { createCompanyApi, uploadCompanyLogoApi } from '@/lib/api/admin-companies';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getFullImageUrl } from '@/lib/utils';

const BUSINESS_TYPES: {
  value: BusinessType; label: string; description: string;
  icon: React.ElementType; color: string; bg: string;
}[] = [
  {
    value: 'retail', label: 'Retail Store', icon: Store,
    description: 'General retail — electronics, clothing, groceries, etc.',
    color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  },
  {
    value: 'pharmacy', label: 'Pharmacy', icon: Pill,
    description: 'Medicine & healthcare — expiry tracking, prescriptions',
    color: 'text-green-700', bg: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
  },
  {
    value: 'building', label: 'Building Materials', icon: HardHat,
    description: 'Construction — weight/length units, bulk pricing',
    color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  },
  {
    value: 'wholesale', label: 'Wholesale Distributor', icon: Warehouse,
    description: 'Bulk distribution — tiered pricing, large orders',
    color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
  },
];

const PLANS = [
  { value: 'free', label: 'Free', price: 'TSh 0/mo', features: '2 users · 100 products' },
  { value: 'basic', label: 'Basic', price: 'TSh 29/mo', features: '5 users · 500 products' },
  { value: 'pro', label: 'Pro', price: 'TSh 79/mo', features: '15 users · 2,000 products' },
  { value: 'enterprise', label: 'Enterprise', price: 'TSh 199/mo', features: 'Unlimited everything' },
];

const CURRENCIES = [
  { value: 'TSH', symbol: 'TSh', label: 'Tanzanian Shilling (TSH)' },
  { value: 'USD', symbol: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { value: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { value: 'NGN', symbol: '₦', label: 'Nigerian Naira (NGN)' },
  { value: 'XOF', symbol: 'CFA', label: 'West African CFA (XOF)' },
  { value: 'KES', symbol: 'KSh', label: 'Kenyan Shilling (KES)' },
  { value: 'GHS', symbol: '₵', label: 'Ghanaian Cedi (GHS)' },
  { value: 'ZAR', symbol: 'R', label: 'South African Rand (ZAR)' },
];

export default function NewCompanyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Company info
  const [company, setCompany] = useState({
    name: '',
    businessTypes: [] as BusinessType[],
    logo: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    currency: 'TSH',
    plan: 'pro',
    isActive: true,
    // Enhanced company details
    vrnNo: '',
    tinNo: '',
    website: '',
    physicalAddress: '',
    postalAddress: '',
    country: '',
    region: '',
    city: '',
    postalCode: '',
    businessLicenseNo: '',
    businessRegistrationNo: '',
    businessType: '',
    industry: '',
    yearEstablished: '',
    contactPerson: '',
    contactPersonTitle: '',
    alternativePhone: '',
    fax: '',
    whatsapp: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    documentPrefix: '',
    documentFooter: '',
    documentHeader: '',
    authorisedSignatory: '',
  });

  // Bank details
  const [bankDetails, setBankDetails] = useState([{
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchName: '',
    branchCode: '',
    swiftCode: '',
    iban: '',
    routingNumber: '',
    sortCode: '',
    bankAddress: '',
    mobileMoneyName: '',
    mobileMoneyNumber: '',
    isPrimary: true,
    is_active: true,
  }]);

  // Terms & conditions
  const [termsConditions, setTermsConditions] = useState([
    {
      documentType: 'invoice',
      title: '',
      termsText: '',
      paymentTerms: '',
      deliveryTerms: '',
      warrantyTerms: '',
      returnPolicy: '',
      latePaymentTerms: '',
      cancellationPolicy: '',
      is_active: true,
    },
    {
      documentType: 'quotation',
      title: '',
      termsText: '',
      paymentTerms: '',
      deliveryTerms: '',
      warrantyTerms: '',
      returnPolicy: '',
      latePaymentTerms: '',
      cancellationPolicy: '',
      is_active: true,
    },
  ]);

  // Admin user credentials
  const [admin, setAdmin] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const setC = (k: string, v: unknown) => {
    setCompany(p => ({ ...p, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const setA = (k: string, v: string) => {
    setAdmin(p => ({ ...p, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[`admin_${k}`]; return n; });
  };

  const toggleBusinessType = (type: BusinessType) => {
    setCompany(p => {
      const exists = p.businessTypes.includes(type);
      const newTypes = exists
        ? p.businessTypes.filter(t => t !== type)
        : [...p.businessTypes, type];
      return { ...p, businessTypes: newTypes };
    });
    setErrors(e => { const n = { ...e }; delete n.businessTypes; return n; });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }
      if (!token) {
        toast.error('You must be logged in as super admin to upload logo');
        return;
      }
      uploadCompanyLogoApi(file, token)
        .then(({ logo_url }) => {
          setC('logo', logo_url);
          toast.success('Logo uploaded successfully');
        })
        .catch((error) => {
          toast.error(error.message || 'Logo upload failed');
        });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!company.name.trim()) e.name = 'Company name is required';
    if (company.businessTypes.length === 0) e.businessTypes = 'Select at least one business type';
    if (!company.email.trim()) e.email = 'Company email is required';
    if (!company.currency) e.currency = 'Select a currency';
    if (!admin.name.trim()) e.admin_name = 'Admin name is required';
    if (!admin.email.trim()) e.admin_email = 'Admin email is required';
    if (!admin.password.trim()) e.admin_password = 'Password is required';
    if (admin.password.length > 0 && admin.password.length < 6) e.admin_password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fix the errors before saving'); return; }
    setSaving(true);
    try {
      if (!token) throw new Error('Unauthorized');
      const selectedCurrency = CURRENCIES.find(c => c.value === company.currency);
      
      // Prepare bank details (only include if bank name is provided)
      const validBankDetails = bankDetails.filter(bank => bank.bankName.trim()).map(bank => ({
        bank_name: bank.bankName,
        account_name: bank.accountName,
        account_number: bank.accountNumber,
        branch_name: bank.branchName,
        branch_code: bank.branchCode,
        swift_code: bank.swiftCode,
        iban: bank.iban,
        routing_number: bank.routingNumber,
        sort_code: bank.sortCode,
        bank_address: bank.bankAddress,
        mobile_money_name: bank.mobileMoneyName,
        mobile_money_number: bank.mobileMoneyNumber,
        is_primary: bank.isPrimary,
        is_active: bank.is_active,
      }));
      
      // Prepare terms conditions (only include if title or terms text is provided)
      const validTermsConditions = termsConditions.filter(tc => 
        tc.title.trim() || tc.termsText.trim() || tc.paymentTerms.trim()
      ).map(tc => ({
        document_type: tc.documentType,
        title: tc.title,
        terms_text: tc.termsText,
        payment_terms: tc.paymentTerms,
        delivery_terms: tc.deliveryTerms,
        warranty_terms: tc.warrantyTerms,
        return_policy: tc.returnPolicy,
        late_payment_terms: tc.latePaymentTerms,
        cancellation_policy: tc.cancellationPolicy,
        is_active: tc.is_active,
      }));
      
      await createCompanyApi({
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        tax_id: company.taxId,
        logo: company.logo || undefined,
        currency: company.currency,
        currency_symbol: selectedCurrency?.symbol || 'TSh',
        types: company.businessTypes,
        subscription_plan: company.plan,
        is_active: company.isActive,
        admin_name: admin.name,
        admin_email: admin.email,
        admin_password: admin.password,
        // Enhanced company details
        vrn_no: company.vrnNo || undefined,
        tin_no: company.tinNo || undefined,
        website: company.website || undefined,
        physical_address: company.physicalAddress || undefined,
        postal_address: company.postalAddress || undefined,
        country: company.country || undefined,
        region: company.region || undefined,
        city: company.city || undefined,
        postal_code: company.postalCode || undefined,
        business_license_no: company.businessLicenseNo || undefined,
        business_registration_no: company.businessRegistrationNo || undefined,
        business_type: company.businessType || undefined,
        industry: company.industry || undefined,
        year_established: company.yearEstablished ? parseInt(company.yearEstablished) : undefined,
        contact_person: company.contactPerson || undefined,
        contact_person_title: company.contactPersonTitle || undefined,
        alternative_phone: company.alternativePhone || undefined,
        fax: company.fax || undefined,
        whatsapp: company.whatsapp || undefined,
        facebook: company.facebook || undefined,
        twitter: company.twitter || undefined,
        instagram: company.instagram || undefined,
        linkedin: company.linkedin || undefined,
        document_prefix: company.documentPrefix || undefined,
        document_footer: company.documentFooter || undefined,
        document_header: company.documentHeader || undefined,
        authorised_signatory: company.authorisedSignatory || undefined,
        // Bank details and terms conditions
        bank_details: validBankDetails,
        terms_conditions: validTermsConditions,
      }, token);

      toast.success(`Company "${company.name}" created!`, {
        description: `Admin: ${admin.email} · Types: ${company.businessTypes.join(', ')}`,
        duration: 5000,
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      });
      router.push('/admin/companies');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create company. Please try again.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const selectedPlan = PLANS.find(p => p.value === company.plan);

  return (
    <div className="min-h-full bg-muted/20">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/admin/companies"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold">Create New Company</h1>
            <p className="text-xs text-muted-foreground">Set up a new shop on the platform</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/admin/companies">Cancel</Link></Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
            {saving
              ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Creating...</>
              : <><Save className="h-4 w-4" />Create Company</>
            }
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-6 space-y-5">

        {/* ══ BUSINESS TYPE ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              Business Type(s)
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">Select all that apply</span>
              {errors.businessTypes && <span className="text-xs text-destructive font-normal ml-2">{errors.businessTypes}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BUSINESS_TYPES.map(type => {
                const Icon = type.icon;
                const selected = company.businessTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleBusinessType(type.value)}
                    className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${type.bg}`}>
                      <Icon className={`h-5 w-5 ${type.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{type.label}</p>
                        {selected && (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                            <CheckCircle2 className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ══ COMPANY LOGO & INFORMATION ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Store className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              </div>
              Company Branding & Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
              <div className="relative group">
                <div className={`h-24 w-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                  company.logo ? 'border-primary/50 bg-background' : 'border-muted-foreground/20 bg-muted/30'
                }`}>
                  {company.logo ? (
                    <img src={getFullImageUrl(company.logo)} alt="Shop Logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Camera className="h-8 w-8 opacity-40" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">No Logo</span>
                    </div>
                  )}
                </div>
                {company.logo && (
                  <button
                    onClick={() => setC('logo', '')}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h4 className="text-sm font-bold">Shop Logo</h4>
                <p className="text-xs text-muted-foreground">
                  Upload your shop's logo. This will be displayed on receipts and the POS interface instantly.
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Image
                  </Button>
                  {company.logo && (
                    <Badge variant="outline" className="h-8 bg-green-50 text-green-700 border-green-200">
                      Logo Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Company / Shop Name" required error={errors.name}>
                <Input
                  placeholder="e.g. Best Pharmacy, Quick Mart"
                  value={company.name}
                  onChange={e => setC('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
              </FormField>
              <FormField label="Business Email" required error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email" placeholder="contact@company.com"
                    value={company.email}
                    onChange={e => setC('email', e.target.value)}
                    className={`pl-9 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
              </FormField>
              <FormField label="Phone Number">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="+1 234 567 8900"
                    value={company.phone}
                    onChange={e => setC('phone', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </FormField>
              <FormField label="Tax ID / VAT Number">
                <Input
                  placeholder="Optional"
                  value={company.taxId}
                  onChange={e => setC('taxId', e.target.value)}
                />
              </FormField>
            </div>
            <FormField label="Address">
              <Textarea
                placeholder="Full business address..."
                value={company.address}
                onChange={e => setC('address', e.target.value)}
                rows={2}
                className="resize-none"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* ══ ENHANCED COMPANY DETAILS ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Building2 className="h-4 w-4 text-purple-700 dark:text-purple-400" />
              </div>
              Professional Company Details
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">Optional - for professional documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tax & Registration */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-purple-700 dark:text-purple-400">Tax & Registration</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="VRN No (VAT Registration)">
                  <Input
                    placeholder="Optional"
                    value={company.vrnNo}
                    onChange={e => setC('vrnNo', e.target.value)}
                  />
                </FormField>
                <FormField label="TIN No (Tax ID)">
                  <Input
                    placeholder="Optional"
                    value={company.tinNo}
                    onChange={e => setC('tinNo', e.target.value)}
                  />
                </FormField>
                <FormField label="Business License No">
                  <Input
                    placeholder="Optional"
                    value={company.businessLicenseNo}
                    onChange={e => setC('businessLicenseNo', e.target.value)}
                  />
                </FormField>
                <FormField label="Business Registration No">
                  <Input
                    placeholder="Optional"
                    value={company.businessRegistrationNo}
                    onChange={e => setC('businessRegistrationNo', e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <Separator />

            {/* Address Details */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-purple-700 dark:text-purple-400">Detailed Address</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Physical Address">
                  <Textarea
                    placeholder="Physical business location..."
                    value={company.physicalAddress}
                    onChange={e => setC('physicalAddress', e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </FormField>
                <FormField label="Postal Address">
                  <Textarea
                    placeholder="Postal address..."
                    value={company.postalAddress}
                    onChange={e => setC('postalAddress', e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </FormField>
                <FormField label="City">
                  <Input
                    placeholder="City"
                    value={company.city}
                    onChange={e => setC('city', e.target.value)}
                  />
                </FormField>
                <FormField label="Region/State">
                  <Input
                    placeholder="Region or State"
                    value={company.region}
                    onChange={e => setC('region', e.target.value)}
                  />
                </FormField>
                <FormField label="Country">
                  <Input
                    placeholder="Country"
                    value={company.country}
                    onChange={e => setC('country', e.target.value)}
                  />
                </FormField>
                <FormField label="Postal Code">
                  <Input
                    placeholder="Postal Code"
                    value={company.postalCode}
                    onChange={e => setC('postalCode', e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <Separator />

            {/* Business & Contact */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-purple-700 dark:text-purple-400">Business & Contact Information</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Business Type">
                  <Input
                    placeholder="e.g., Limited Company, Sole Proprietor"
                    value={company.businessType}
                    onChange={e => setC('businessType', e.target.value)}
                  />
                </FormField>
                <FormField label="Industry">
                  <Input
                    placeholder="e.g., Retail, Manufacturing, Services"
                    value={company.industry}
                    onChange={e => setC('industry', e.target.value)}
                  />
                </FormField>
                <FormField label="Year Established">
                  <Input
                    type="number"
                    placeholder="e.g., 2020"
                    value={company.yearEstablished}
                    onChange={e => setC('yearEstablished', e.target.value)}
                  />
                </FormField>
                <FormField label="Website">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="https://example.com"
                      value={company.website}
                      onChange={e => setC('website', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>
                <FormField label="Contact Person">
                  <Input
                    placeholder="Primary contact person"
                    value={company.contactPerson}
                    onChange={e => setC('contactPerson', e.target.value)}
                  />
                </FormField>
                <FormField label="Contact Person Title">
                  <Input
                    placeholder="e.g., Manager, Director"
                    value={company.contactPersonTitle}
                    onChange={e => setC('contactPersonTitle', e.target.value)}
                  />
                </FormField>
                <FormField label="Alternative Phone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="+1 234 567 8900"
                      value={company.alternativePhone}
                      onChange={e => setC('alternativePhone', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>
                <FormField label="Fax">
                  <Input
                    placeholder="Fax number"
                    value={company.fax}
                    onChange={e => setC('fax', e.target.value)}
                  />
                </FormField>
                <FormField label="WhatsApp">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="+1 234 567 8900"
                      value={company.whatsapp}
                      onChange={e => setC('whatsapp', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>
              </div>
            </div>

            <Separator />

            {/* Social Media */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-purple-700 dark:text-purple-400">Social Media</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Facebook">
                  <Input
                    placeholder="Facebook profile/URL"
                    value={company.facebook}
                    onChange={e => setC('facebook', e.target.value)}
                  />
                </FormField>
                <FormField label="Twitter">
                  <Input
                    placeholder="Twitter handle/URL"
                    value={company.twitter}
                    onChange={e => setC('twitter', e.target.value)}
                  />
                </FormField>
                <FormField label="Instagram">
                  <Input
                    placeholder="Instagram profile/URL"
                    value={company.instagram}
                    onChange={e => setC('instagram', e.target.value)}
                  />
                </FormField>
                <FormField label="LinkedIn">
                  <Input
                    placeholder="LinkedIn profile/URL"
                    value={company.linkedin}
                    onChange={e => setC('linkedin', e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══ BANK DETAILS ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CreditCard className="h-4 w-4 text-green-700 dark:text-green-400" />
              </div>
              Bank Details
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">For payment processing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankDetails.map((bank, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Bank Account {index + 1}</h4>
                  {bankDetails.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newBanks = bankDetails.filter((_, i) => i !== index);
                        setBankDetails(newBanks);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Bank Name" required>
                    <Input
                      placeholder="e.g., National Bank, CRDB"
                      value={bank.bankName}
                      onChange={e => {
                        const newBanks = [...bankDetails];
                        newBanks[index].bankName = e.target.value;
                        setBankDetails(newBanks);
                      }}
                    />
                  </FormField>
                  <FormField label="Account Name" required>
                    <Input
                      placeholder="Account holder name"
                      value={bank.accountName}
                      onChange={e => {
                        const newBanks = [...bankDetails];
                        newBanks[index].accountName = e.target.value;
                        setBankDetails(newBanks);
                      }}
                    />
                  </FormField>
                  <FormField label="Account Number" required>
                    <Input
                      placeholder="Bank account number"
                      value={bank.accountNumber}
                      onChange={e => {
                        const newBanks = [...bankDetails];
                        newBanks[index].accountNumber = e.target.value;
                        setBankDetails(newBanks);
                      }}
                    />
                  </FormField>
                  <FormField label="Branch Name">
                    <Input
                      placeholder="Bank branch"
                      value={bank.branchName}
                      onChange={e => {
                        const newBanks = [...bankDetails];
                        newBanks[index].branchName = e.target.value;
                        setBankDetails(newBanks);
                      }}
                    />
                  </FormField>
                  <FormField label="SWIFT Code">
                    <Input
                      placeholder="International transfers"
                      value={bank.swiftCode}
                      onChange={e => {
                        const newBanks = [...bankDetails];
                        newBanks[index].swiftCode = e.target.value;
                        setBankDetails(newBanks);
                      }}
                    />
                  </FormField>
                  <FormField label="Mobile Money (e.g. M-Pesa)">
                    <Input
                      placeholder="Operator name"
                      value={bank.mobileMoneyName}
                      onChange={e => {
                        const newBanks = [...bankDetails];
                        newBanks[index].mobileMoneyName = e.target.value;
                        setBankDetails(newBanks);
                      }}
                    />
                  </FormField>
                  <FormField label="Mobile Money Number">
                    <Input
                      placeholder="Number for payments"
                      value={bank.mobileMoneyNumber}
                      onChange={e => {
                        const newBanks = [...bankDetails];
                        newBanks[index].mobileMoneyNumber = e.target.value;
                        setBankDetails(newBanks);
                      }}
                    />
                  </FormField>
                  <FormField label="IBAN">
                    <Input
                      placeholder="International bank account"
                      value={bank.iban}
                      onChange={e => {
                        const newBanks = [...bankDetails];
                        newBanks[index].iban = e.target.value;
                        setBankDetails(newBanks);
                      }}
                    />
                  </FormField>
                </div>
                <FormField label="Bank Address">
                  <Textarea
                    placeholder="Bank branch address"
                    value={bank.bankAddress}
                    onChange={e => {
                      const newBanks = [...bankDetails];
                      newBanks[index].bankAddress = e.target.value;
                      setBankDetails(newBanks);
                    }}
                    rows={2}
                    className="resize-none"
                  />
                </FormField>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setBankDetails([...bankDetails, {
                bankName: '',
                accountName: '',
                accountNumber: '',
                branchName: '',
                branchCode: '',
                swiftCode: '',
                iban: '',
                routingNumber: '',
                sortCode: '',
                bankAddress: '',
                isPrimary: false,
                is_active: true,
              }])}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Add Another Bank Account
            </Button>
          </CardContent>
        </Card>

        {/* ══ TERMS & CONDITIONS ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Building2 className="h-4 w-4 text-orange-700 dark:text-orange-400" />
              </div>
              Terms & Conditions
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">For documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {termsConditions.map((terms, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold capitalize">{terms.documentType} Terms</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <FormField label="Title">
                    <Input
                      placeholder={`Terms title for ${terms.documentType}`}
                      value={terms.title}
                      onChange={e => {
                        const newTerms = [...termsConditions];
                        newTerms[index].title = e.target.value;
                        setTermsConditions(newTerms);
                      }}
                    />
                  </FormField>
                  <FormField label="Payment Terms">
                    <Textarea
                      placeholder="e.g., Payment due within 30 days"
                      value={terms.paymentTerms}
                      onChange={e => {
                        const newTerms = [...termsConditions];
                        newTerms[index].paymentTerms = e.target.value;
                        setTermsConditions(newTerms);
                      }}
                      rows={2}
                      className="resize-none"
                    />
                  </FormField>
                  <FormField label="Delivery Terms">
                    <Textarea
                      placeholder="e.g., Delivery within 7 business days"
                      value={terms.deliveryTerms}
                      onChange={e => {
                        const newTerms = [...termsConditions];
                        newTerms[index].deliveryTerms = e.target.value;
                        setTermsConditions(newTerms);
                      }}
                      rows={2}
                      className="resize-none"
                    />
                  </FormField>
                  <FormField label="General Terms">
                    <Textarea
                      placeholder="General terms and conditions..."
                      value={terms.termsText}
                      onChange={e => {
                        const newTerms = [...termsConditions];
                        newTerms[index].termsText = e.target.value;
                        setTermsConditions(newTerms);
                      }}
                      rows={3}
                      className="resize-none"
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ══ DOCUMENT SETTINGS ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Store className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              </div>
              Document Settings
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">For generated documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Document Prefix">
              <Input
                placeholder="e.g., INV-, QUO- (for invoice numbers)"
                value={company.documentPrefix}
                onChange={e => setC('documentPrefix', e.target.value)}
              />
            </FormField>
            <FormField label="Authorised Signatory Name">
              <Input
                placeholder="Name that appears under signature line"
                value={company.authorisedSignatory}
                onChange={e => setC('authorisedSignatory', e.target.value)}
              />
            </FormField>
            <FormField label="Document Header">
              <Textarea
                placeholder="Header text for documents (appears at top)"
                value={company.documentHeader}
                onChange={e => setC('documentHeader', e.target.value)}
                rows={2}
                className="resize-none"
              />
            </FormField>
            <FormField label="Document Footer">
              <Textarea
                placeholder="Footer text for documents (appears at bottom)"
                value={company.documentFooter}
                onChange={e => setC('documentFooter', e.target.value)}
                rows={2}
                className="resize-none"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* ══ PLAN & CURRENCY ══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CreditCard className="h-4 w-4 text-green-700 dark:text-green-400" />
              </div>
              Subscription & Currency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan selector */}
            <FormField label="Subscription Plan" required>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PLANS.map(plan => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setC('plan', plan.value)}
                    className={`flex flex-col rounded-xl border-2 p-3 text-left transition-all ${
                      company.plan === plan.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="font-bold text-sm">{plan.label}</span>
                    <span className="text-xs text-primary font-semibold mt-0.5">{plan.price}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{plan.features}</span>
                  </button>
                ))}
              </div>
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Currency" required error={errors.currency}>
                <Select value={company.currency} onValueChange={v => setC('currency', v)}>
                  <SelectTrigger className={errors.currency ? 'border-destructive' : ''}>
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="font-mono font-bold mr-2">{c.symbol}</span>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Account Status">
                <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-2.5 h-10">
                  <span className={`text-sm font-medium ${company.isActive ? 'text-green-700' : 'text-muted-foreground'}`}>
                    {company.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Switch checked={company.isActive} onCheckedChange={v => setC('isActive', v)} />
                </div>
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* ══ ADMIN USER CREDENTIALS ══ */}
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              Admin User Credentials
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              These credentials will be given to the shop owner to log in. They can add more staff from within the app.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Admin Full Name" required error={errors.admin_name}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. John Smith"
                    value={admin.name}
                    onChange={e => setA('name', e.target.value)}
                    className={`pl-9 ${errors.admin_name ? 'border-destructive' : ''}`}
                  />
                </div>
              </FormField>

              <FormField label="Admin Phone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="+1 234 567 8900"
                    value={admin.phone}
                    onChange={e => setA('phone', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </FormField>
            </div>

            <FormField label="Login Email" required error={errors.admin_email}
              hint="This is the email the admin will use to log in">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email" placeholder="admin@shopname.com"
                  value={admin.email}
                  onChange={e => setA('email', e.target.value)}
                  className={`pl-9 ${errors.admin_email ? 'border-destructive' : ''}`}
                />
              </div>
            </FormField>

            <FormField label="Login Password" required error={errors.admin_password}
              hint="Minimum 6 characters — share this securely with the shop owner">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a secure password"
                  value={admin.password}
                  onChange={e => setA('password', e.target.value)}
                  className={`pl-9 pr-10 ${errors.admin_password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
          </CardContent>
        </Card>

        {/* Summary preview */}
        {company.name && company.businessTypes.length > 0 && admin.email && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-green-200">
                  {company.logo ? (
                    <img src={company.logo} alt="Logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Store className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1 space-y-1 text-sm">
                  <p className="font-semibold text-green-800 dark:text-green-300">Ready to create</p>
                  <div className="text-green-700 dark:text-green-400 space-y-0.5 text-xs">
                    <p>🏪 <strong>{company.name}</strong> · {company.businessTypes.map(t => BUSINESS_TYPES.find(bt => bt.value === t)?.label).join(' + ')}</p>
                    <p>📦 Plan: <strong>{selectedPlan?.label}</strong> ({selectedPlan?.price})</p>
                    <p>👤 Admin: <strong>{admin.name || 'Not set'}</strong> · {admin.email}</p>
                    <p>💰 Currency: <strong>{company.currency}</strong></p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom save */}
        <div className="flex gap-3 pb-8">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/admin/companies">Cancel</Link>
          </Button>
          <Button className="flex-1 h-12 text-base gap-2" onClick={handleSave} disabled={saving}>
            {saving
              ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Creating Company...</>
              : <><CheckCircle2 className="h-5 w-5" />Create Company & Set Up Shop</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label, required, hint, error, children,
}: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

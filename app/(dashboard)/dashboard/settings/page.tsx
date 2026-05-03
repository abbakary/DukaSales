"use client"

import { useEffect, useState } from "react"
import {
  Save,
  Store,
  Bell,
  Receipt,
  CreditCard,
  Percent,
  Printer,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getCurrentSubscriptionApi } from "@/lib/api/admin-subscriptions"
import { useI18n } from "@/lib/i18n/use-i18n"

export default function SettingsPage() {
  const { user, company, token } = useAuthStore()
  const { language, setLanguage, t } = useI18n()
  const [activeTab, setActiveTab] = useState("general")
  const [subscription, setSubscription] = useState<any>(null)

  const isCashier = user?.role === 'cashier';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isManager = user?.role === 'manager';
  
  const [generalSettings, setGeneralSettings] = useState({
    businessName: company?.name || "",
    email: company?.email || "",
    phone: company?.phone || "",
    address: company?.address || "",
    currency: company?.currency || "Tsh",
    timezone: "UTC",
    language: language,
  })
  useEffect(() => {
    setGeneralSettings((prev) => ({ ...prev, language }))
  }, [language])


  const [posSettings, setPosSettings] = useState({
    defaultTaxRate: 0,
    allowDiscounts: true,
    requireCustomer: false,
    allowCreditSales: true,
    printReceiptByDefault: true,
    showProductImages: true,
    allowPriceEdit: false,
    lowStockAlert: 10,
  })

  const [receiptSettings, setReceiptSettings] = useState({
    showLogo: true,
    headerText: "Thank you for your purchase!",
    footerText: "Visit us again",
    showTaxBreakdown: true,
    showCashierName: true,
    paperWidth: "80mm",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlert: true,
    dailySalesReport: true,
    expiryAlert: true,
    creditDueAlert: true,
    emailNotifications: true,
  })

  const handleSaveGeneral = () => {
    setLanguage(generalSettings.language as 'en' | 'sw')
  }

  useEffect(() => {
    if (!token) return
    getCurrentSubscriptionApi(token)
      .then((data) => setSubscription(data))
      .catch(() => {
        // subscription widget is non-blocking
      })
  }, [token])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {isCashier ? t('settings.subtitleCashier') : t('settings.subtitleShop')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">{isCashier ? t('settings.personal') : t('settings.general')}</span>
          </TabsTrigger>
          {!isCashier && (
            <>
              <TabsTrigger value="pos" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">POS</span>
              </TabsTrigger>
              <TabsTrigger value="receipt" className="gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.receipt')}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.notifications')}</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{isCashier ? t('settings.personalSettings') : t('settings.generalSettings')}</CardTitle>
              <CardDescription>
                {isCashier ? "Manage your profile and display preferences" : "Basic store information and preferences"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isCashier ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">{t('settings.businessName')}</Label>
                    <Input
                      id="businessName"
                      value={generalSettings.businessName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, businessName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('settings.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={generalSettings.email}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('settings.phone')}</Label>
                    <Input
                      id="phone"
                      value={generalSettings.phone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">{t('settings.address')}</Label>
                    <Input
                      id="address"
                      value={generalSettings.address}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Your Name</Label>
                    <Input
                      id="userName"
                      value={user?.name || ""}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Your Email</Label>
                    <Input
                      id="userEmail"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('settings.currency')}</Label>
                  <Select
                    value={generalSettings.currency}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TSH">TSH (TSh)</SelectItem>
                      <SelectItem value="USD">USD (USD)</SelectItem>
                      <SelectItem value="EUR">EUR (EUR)</SelectItem>
                      <SelectItem value="GBP">GBP (GBP)</SelectItem>
                      <SelectItem value="XOF">XOF (CFA)</SelectItem>
                      <SelectItem value="NGN">NGN (NGN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">{t('common.language')}</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) => {
                      const next = value as 'en' | 'sw';
                      setGeneralSettings({ ...generalSettings, language: next });
                      setLanguage(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t('common.english')}</SelectItem>
                      <SelectItem value="sw">{t('common.swahili')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.saveChanges')}
                </Button>
              </div>
            </CardContent>
            </Card>

            {!isCashier && (
              <Card>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                  <CardDescription>Your current plan and limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-bold capitalize">{company?.subscriptionPlan || subscription?.company?.subscription_plan || 'free'}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Expiry</p>
                    <p className="font-medium">
                      {company?.subscriptionExpiry
                        ? new Date(company.subscriptionExpiry).toLocaleDateString()
                        : subscription?.company?.subscription_expiry
                          ? new Date(subscription.company.subscription_expiry).toLocaleDateString()
                          : "Not set"}
                    </p>
                  </div>
                  {subscription?.plan?.features?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Included Features</p>
                      <ul className="space-y-1 text-sm">
                        {subscription.plan.features.slice(0, 6).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center text-muted-foreground">
                            <div className="mr-2 h-1 w-1 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* POS Settings */}
        <TabsContent value="pos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>POS Settings</CardTitle>
              <CardDescription>Configure point of sale behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    min="0"
                    max="100"
                    value={posSettings.defaultTaxRate}
                    onChange={(e) => setPosSettings({ ...posSettings, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockAlert">Low Stock Alert Threshold</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    min="0"
                    value={posSettings.lowStockAlert}
                    onChange={(e) => setPosSettings({ ...posSettings, lowStockAlert: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Discounts</Label>
                    <p className="text-sm text-muted-foreground">Enable discounts on items and cart</p>
                  </div>
                  <Switch
                    checked={posSettings.allowDiscounts}
                    onCheckedChange={(checked) => setPosSettings({ ...posSettings, allowDiscounts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Customer</Label>
                    <p className="text-sm text-muted-foreground">Require customer selection for each sale</p>
                  </div>
                  <Switch
                    checked={posSettings.requireCustomer}
                    onCheckedChange={(checked) => setPosSettings({ ...posSettings, requireCustomer: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Credit Sales</Label>
                    <p className="text-sm text-muted-foreground">Enable credit/debt sales to customers</p>
                  </div>
                  <Switch
                    checked={posSettings.allowCreditSales}
                    onCheckedChange={(checked) => setPosSettings({ ...posSettings, allowCreditSales: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Print Receipt by Default</Label>
                    <p className="text-sm text-muted-foreground">Auto-print receipt after sale</p>
                  </div>
                  <Switch
                    checked={posSettings.printReceiptByDefault}
                    onCheckedChange={(checked) => setPosSettings({ ...posSettings, printReceiptByDefault: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Product Images</Label>
                    <p className="text-sm text-muted-foreground">Display product images in POS grid</p>
                  </div>
                  <Switch
                    checked={posSettings.showProductImages}
                    onCheckedChange={(checked) => setPosSettings({ ...posSettings, showProductImages: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Price Edit</Label>
                    <p className="text-sm text-muted-foreground">Allow cashiers to edit product prices</p>
                  </div>
                  <Switch
                    checked={posSettings.allowPriceEdit}
                    onCheckedChange={(checked) => setPosSettings({ ...posSettings, allowPriceEdit: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Settings</CardTitle>
              <CardDescription>Customize your receipt format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="headerText">Header Text</Label>
                  <Input
                    id="headerText"
                    value={receiptSettings.headerText}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, headerText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    value={receiptSettings.footerText}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, footerText: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paperWidth">Paper Width</Label>
                <Select
                  value={receiptSettings.paperWidth}
                  onValueChange={(value) => setReceiptSettings({ ...receiptSettings, paperWidth: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Logo</Label>
                    <p className="text-sm text-muted-foreground">Display business logo on receipt</p>
                  </div>
                  <Switch
                    checked={receiptSettings.showLogo}
                    onCheckedChange={(checked) => setReceiptSettings({ ...receiptSettings, showLogo: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Tax Breakdown</Label>
                    <p className="text-sm text-muted-foreground">Show detailed tax information</p>
                  </div>
                  <Switch
                    checked={receiptSettings.showTaxBreakdown}
                    onCheckedChange={(checked) => setReceiptSettings({ ...receiptSettings, showTaxBreakdown: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Cashier Name</Label>
                    <p className="text-sm text-muted-foreground">Display cashier name on receipt</p>
                  </div>
                  <Switch
                    checked={receiptSettings.showCashierName}
                    onCheckedChange={(checked) => setReceiptSettings({ ...receiptSettings, showCashierName: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowStockAlert}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, lowStockAlert: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Sales Report</Label>
                    <p className="text-sm text-muted-foreground">Receive daily sales summary</p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailySalesReport}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, dailySalesReport: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Expiry Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified about expiring products</p>
                  </div>
                  <Switch
                    checked={notificationSettings.expiryAlert}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, expiryAlert: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Credit Due Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notifications for overdue credits</p>
                  </div>
                  <Switch
                    checked={notificationSettings.creditDueAlert}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, creditDueAlert: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

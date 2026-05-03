"use client"

import { useState } from "react"
import {
  Save,
  Globe,
  Shield,
  Mail,
  Bell,
  CreditCard,
  Palette,
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
import { Textarea } from "@/components/ui/textarea"

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  
  const [generalSettings, setGeneralSettings] = useState({
    platformName: "SaaS POS System",
    supportEmail: "support@saaspos.com",
    supportPhone: "+1234567890",
    defaultCurrency: "TSH",
    defaultTimezone: "UTC",
    maintenanceMode: false,
  })

  const [securitySettings, setSecuritySettings] = useState({
    requireEmailVerification: true,
    twoFactorEnabled: false,
    passwordMinLength: 8,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    allowPublicRegistration: true,
  })

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "noreply@saaspos.com",
    fromName: "SaaS POS System",
  })

  const [billingSettings, setBillingSettings] = useState({
    stripeEnabled: true,
    stripePublicKey: "",
    stripeSecretKey: "",
    trialDays: 14,
    gracePeriodDays: 7,
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={generalSettings.platformName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    value={generalSettings.supportPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select
                    value={generalSettings.defaultCurrency}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, defaultCurrency: value })}
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable access to the platform</p>
                </div>
                <Switch
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, maintenanceMode: checked })}
                />
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

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) || 8 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="1"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Users must verify email before accessing</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireEmailVerification}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireEmailVerification: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Public Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new companies to register</p>
                  </div>
                  <Switch
                    checked={securitySettings.allowPublicRegistration}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, allowPublicRegistration: checked })}
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

        {/* Email Settings */}
        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure email delivery settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Test Connection</Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>Configure payment and subscription settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Stripe Payments</Label>
                  <p className="text-sm text-muted-foreground">Accept payments via Stripe</p>
                </div>
                <Switch
                  checked={billingSettings.stripeEnabled}
                  onCheckedChange={(checked) => setBillingSettings({ ...billingSettings, stripeEnabled: checked })}
                />
              </div>

              {billingSettings.stripeEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                    <Input
                      id="stripePublicKey"
                      value={billingSettings.stripePublicKey}
                      onChange={(e) => setBillingSettings({ ...billingSettings, stripePublicKey: e.target.value })}
                      placeholder="pk_live_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      value={billingSettings.stripeSecretKey}
                      onChange={(e) => setBillingSettings({ ...billingSettings, stripeSecretKey: e.target.value })}
                      placeholder="sk_live_..."
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="trialDays">Trial Period (days)</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    min="0"
                    value={billingSettings.trialDays}
                    onChange={(e) => setBillingSettings({ ...billingSettings, trialDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gracePeriodDays">Grace Period (days)</Label>
                  <Input
                    id="gracePeriodDays"
                    type="number"
                    min="0"
                    value={billingSettings.gracePeriodDays}
                    onChange={(e) => setBillingSettings({ ...billingSettings, gracePeriodDays: parseInt(e.target.value) || 0 })}
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

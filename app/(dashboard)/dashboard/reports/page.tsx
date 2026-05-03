"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Banknote,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db/dexie"
import { useI18n } from "@/lib/i18n/use-i18n"

export default function ReportsPage() {
  const { user, company } = useAuthStore()
  const currency = company?.currencySymbol || "Tsh"
  const [dateRange, setDateRange] = useState("this_month")
  const { t } = useI18n()

  const isCashier = user?.role === 'cashier';
  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const transactions = useLiveQuery(
    async () => {
      if (!company?.id) return []
      let query = db.transactions.where("companyId").equals(company.id)
      const allTx = await query.toArray();
      
      if (isCashier && user?.id) {
        return allTx.filter(tx => tx.cashierId === user.id);
      }
      return allTx;
    },
    [company?.id, user?.id, user?.role],
    []
  )
  const products = useLiveQuery(
    async () => {
      if (!company?.id) return []
      return db.products.where("companyId").equals(company.id).toArray()
    },
    [company?.id],
    []
  )
  const customers = useLiveQuery(
    async () => {
      if (!company?.id) return []
      return db.customers.where("companyId").equals(company.id).toArray()
    },
    [company?.id],
    []
  )
  const debts = useLiveQuery(
    async () => {
      if (!company?.id) return []
      return db.debts.where("companyId").equals(company.id).toArray()
    },
    [company?.id],
    []
  )

  const stats = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    if (dateRange === "today") start.setHours(0, 0, 0, 0)
    else if (dateRange === "this_week") {
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
    } else if (dateRange === "this_month") {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
    } else if (dateRange === "last_month") {
      start.setMonth(now.getMonth() - 1, 1)
      start.setHours(0, 0, 0, 0)
    } else if (dateRange === "this_year") {
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
    }
    const inRange = (transactions || []).filter((t) => new Date(t.createdAt) >= start)
    const sales = inRange.filter((t) => t.type === "sale" && t.status === "completed")
    const returns = inRange.filter((t) => t.type === "return")
    const revenue = sales.reduce((sum, t) => sum + (Number(t.total) || 0), 0)
    const returnAmount = returns.reduce((sum, t) => sum + (Number(t.total) || 0), 0)
    const cogs = sales.reduce(
      (sum, t) => sum + (t.items || []).reduce((itemSum, item) => itemSum + (Number(item.costPrice) || 0) * (Number(item.quantity) || 0), 0),
      0
    )
    const netProfit = revenue - returnAmount - cogs
    const pendingPayments = (debts || [])
      .filter((d) => d.type === "receivable" && (d.status === "pending" || d.status === "partial"))
      .reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0)
    return {
      revenue,
      netProfit,
      totalSales: sales.length,
      totalProducts: (products || []).length,
      activeCustomers: (customers || []).length,
      pendingPayments,
    }
  }, [transactions, products, customers, debts, dateRange])

  const allReportCards = [
    {
      title: t("reports.salesReport"),
      description: isCashier ? t("reports.yourSalesPerformance") : t("reports.detailedSalesBreakdown"),
      icon: ShoppingCart,
      href: "/dashboard/reports/sales",
      roles: ["admin", "manager", "cashier"],
      stats: {
        primary: `${currency}${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        label: isCashier ? t("reports.myRevenue") : t("reports.totalRevenue"),
        change: `${stats.totalSales} ${t("reports.completedSales")}`,
        trend: "up",
      },
    },
    {
      title: t("reports.inventoryReport"),
      description: t("reports.stockValuationAnalysis"),
      icon: Package,
      href: "/dashboard/reports/inventory",
      roles: ["admin", "manager"],
      stats: {
        primary: stats.totalProducts.toLocaleString(),
        label: t("reports.totalProducts"),
        change: t("reports.stockHealthReport"),
        trend: "warning",
      },
    },
    {
      title: t("reports.financialReport"),
      description: t("reports.profitLossSummary"),
      icon: Banknote,
      href: "/dashboard/reports/financial",
      roles: ["admin", "manager"],
      stats: {
        primary: `${currency}${stats.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        label: t("reports.netProfit"),
        change: t("reports.afterProductCost"),
        trend: stats.netProfit >= 0 ? "up" : "down",
      },
    },
    {
      title: t("reports.customerReport"),
      description: t("reports.customerActivityAnalysis"),
      icon: Users,
      href: "/dashboard/reports/customers",
      roles: ["admin", "manager"],
      stats: {
        primary: stats.activeCustomers.toLocaleString(),
        label: t("reports.activeCustomers"),
        change: t("reports.customerBehaviorReport"),
        trend: "up",
      },
    },
  ]

  const reportCards = allReportCards.filter(card => !card.roles || (user && card.roles.includes(user.role)));

  const quickStats = [
    {
      label: isCashier ? t("dashboard.myTodaySales") : t("reports.todaysSales"),
      value: `${currency}${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: `${stats.totalSales} ${t("reports.completed")}`,
      trend: "up",
    },
    {
      label: t("reports.performance"),
      value: isCashier ? t("reports.active") : `${currency}${Math.max(0, stats.netProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: isCashier ? t("reports.yourStatus") : t("reports.netProfit"),
      trend: "up",
      hidden: isCashier && false, // We can decide to hide some for cashier
    },
    {
      label: t("reports.products"),
      value: `${stats.totalProducts.toLocaleString()}`,
      change: `${stats.totalProducts} ${t("reports.inCatalog")}`,
      trend: "up",
    },
    {
      label: t("reports.pendingPayments"),
      value: `${currency}${stats.pendingPayments.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: t("reports.receivables"),
      trend: "warning",
      roles: ["admin", "manager"],
    },
  ].filter(stat => !stat.roles || (user && stat.roles.includes(user.role)));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="rounded-xl border bg-gradient-to-r from-primary to-primary/80 px-5 py-4 text-primary-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
          <p className="text-primary-foreground/80">{t("reports.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t("reports.today")}</SelectItem>
              <SelectItem value="this_week">{t("reports.thisWeek")}</SelectItem>
              <SelectItem value="this_month">{t("reports.thisMonth")}</SelectItem>
              <SelectItem value="last_month">{t("reports.lastMonth")}</SelectItem>
              <SelectItem value="this_quarter">{t("reports.thisQuarter")}</SelectItem>
              <SelectItem value="this_year">{t("reports.thisYear")}</SelectItem>
              <SelectItem value="custom">{t("reports.customRange")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            {t("reports.exportAll")}
          </Button>
        </div>
      </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span
                  className={`flex items-center text-sm ${
                    stat.trend === "up"
                      ? "text-green-600"
                      : stat.trend === "down"
                      ? "text-destructive"
                      : "text-amber-600"
                  }`}
                >
                  {stat.trend === "up" && <TrendingUp className="mr-1 h-4 w-4" />}
                  {stat.trend === "down" && <TrendingDown className="mr-1 h-4 w-4" />}
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {reportCards.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.title} className="transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">{report.stats.primary}</p>
                    <p className="text-sm text-muted-foreground">{report.stats.label}</p>
                    <p
                      className={`mt-1 text-sm ${
                        report.stats.trend === "up"
                          ? "text-green-600"
                          : report.stats.trend === "down"
                          ? "text-destructive"
                          : "text-amber-600"
                      }`}
                    >
                      {report.stats.trend === "up" && <TrendingUp className="mr-1 inline h-4 w-4" />}
                      {report.stats.trend === "down" && <TrendingDown className="mr-1 inline h-4 w-4" />}
                      {report.stats.change}
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={report.href}>
                      {t("reports.viewReport")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Reports */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.additionalReports")}</CardTitle>
          <CardDescription>{t("reports.accessMoreReports")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Daily Sales Summary", icon: BarChart3 },
              { title: "Product Performance", icon: Package },
              { title: "Staff Performance", icon: Users },
              { title: "Tax Report", icon: Banknote },
              { title: "Credit Report", icon: TrendingUp },
              { title: "Stock Movement", icon: Package },
            ].map((report) => {
              const Icon = report.icon
              return (
                <Button
                  key={report.title}
                  variant="outline"
                  className="h-auto justify-start p-4"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {report.title}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

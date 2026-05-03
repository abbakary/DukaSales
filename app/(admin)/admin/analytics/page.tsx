"use client"

import { useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Banknote,
  ShoppingCart,
  Calendar,
  Download,
  BarChart3,
  PieChart,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("this_month")

  const stats = {
    totalRevenue: 125430,
    revenueChange: 15.3,
    totalCompanies: 156,
    companiesChange: 8,
    activeUsers: 892,
    usersChange: 12.5,
    totalTransactions: 45231,
    transactionsChange: 22.1,
  }

  const topCompanies = [
    { name: "Tech Solutions Ltd", types: ["retail"], revenue: 12500, transactions: 234, growth: 15 },
    { name: "MediCare Pharmacy", types: ["pharmacy"], revenue: 9800, transactions: 189, growth: 8 },
    { name: "BuildRight Materials", types: ["building"], revenue: 8900, transactions: 145, growth: -3 },
    { name: "WholeSale Plus", types: ["wholesale"], revenue: 7600, transactions: 98, growth: 22 },
    { name: "Hybrid Mega Mart", types: ["retail", "pharmacy"], revenue: 15400, transactions: 412, growth: 12 },
  ]

  const subscriptionStats = [
    { plan: "Enterprise", count: 12, revenue: 5880, percentage: 15 },
    { plan: "Pro", count: 45, revenue: 13500, percentage: 35 },
    { plan: "Basic", count: 67, revenue: 13400, percentage: 45 },
    { plan: "Free", count: 32, revenue: 0, percentage: 5 },
  ]

  const recentActivity = [
    { event: "New company registered", company: "Fresh Foods Ltd", time: "2 hours ago" },
    { event: "Subscription upgraded", company: "Tech Solutions Ltd", time: "5 hours ago" },
    { event: "High transaction volume", company: "MediCare Pharmacy", time: "8 hours ago" },
    { event: "New company registered", company: "Fashion Hub", time: "1 day ago" },
    { event: "Subscription cancelled", company: "Old Shop Co", time: "2 days ago" },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">Monitor platform performance and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TSh {stats.totalRevenue.toLocaleString()}</div>
            <p className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{stats.revenueChange}% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{stats.companiesChange} new this period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{stats.usersChange}% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
            <p className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{stats.transactionsChange}% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Companies */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Performing Companies
            </CardTitle>
            <CardDescription>Companies ranked by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCompanies.map((company, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {company.types.join(' + ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">TSh {company.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{company.transactions}</TableCell>
                    <TableCell className="text-right">
                      <span className={`flex items-center justify-end ${company.growth >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {company.growth >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {Math.abs(company.growth)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Subscription Distribution
            </CardTitle>
            <CardDescription>Companies by plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionStats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stat.plan}</span>
                  <span className="text-muted-foreground">
                    {stat.count} ({stat.percentage}%)
                  </span>
                </div>
                <Progress value={stat.percentage} className="h-2" />
              </div>
            ))}
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total MRR</span>
                <span className="font-bold">
                  TSh {subscriptionStats.reduce((sum, s) => sum + s.revenue, 0).toLocaleString()}/mo
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{activity.event}</p>
                  <p className="text-sm text-muted-foreground">{activity.company}</p>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="signups">New Signups</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Volume</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Monthly recurring revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <BarChart3 className="mr-2 h-8 w-8" />
                Chart visualization would go here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signups" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>New Company Signups</CardTitle>
              <CardDescription>Registration trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <BarChart3 className="mr-2 h-8 w-8" />
                Chart visualization would go here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
              <CardDescription>Platform-wide transaction activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <BarChart3 className="mr-2 h-8 w-8" />
                Chart visualization would go here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

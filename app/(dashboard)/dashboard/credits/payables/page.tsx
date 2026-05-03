"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Banknote,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiFetch } from "@/lib/api/client"
import { toast } from "sonner"

type PayableDebt = {
  id: string
  type: "payable" | "receivable"
  entityId: string
  entityName: string
  referenceNumber: string
  originalAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate?: Date
  status: "pending" | "partial" | "paid" | "overdue" | "written_off"
}

function mapDebt(row: any): PayableDebt {
  return {
    id: row.id,
    type: row.type,
    entityId: row.entity_id,
    entityName: row.entity_name || "Unknown",
    referenceNumber: row.reference_number || "N/A",
    originalAmount: Number(row.original_amount || 0),
    paidAmount: Number(row.paid_amount || 0),
    remainingAmount: Number(row.remaining_amount || 0),
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    status: row.status || "pending",
  }
}

export default function PayablesPage() {
  const { company, token } = useAuthStore()
  const currency = company?.currencySymbol || "Tsh"
  const [debts, setDebts] = useState<PayableDebt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<PayableDebt | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")

  const fetchPayables = useCallback(async (quiet = false) => {
    if (!token) {
      setDebts([])
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }
    if (quiet) setIsRefreshing(true)
    else setIsLoading(true)
    try {
      const data = await apiFetch<any[]>("/tenant/debts", { token })
      const mapped = (data || []).map(mapDebt).filter((d) => d.type === "payable")
      setDebts(mapped)
    } catch (e: any) {
      toast.error(e.message || "Failed to load payables")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchPayables()
  }, [fetchPayables])

  const filteredDebts = useMemo(() => debts.filter(debt => {
    const matchesSearch = debt.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      debt.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || debt.status === statusFilter
    return matchesSearch && matchesStatus
  }), [debts, searchQuery, statusFilter])

  const getStatusBadge = (status: PayableDebt["status"]) => {
    const styles = {
      pending: { variant: "outline" as const, icon: Clock },
      partial: { variant: "default" as const, icon: Banknote },
      paid: { variant: "default" as const, icon: CheckCircle, className: "bg-green-500" },
      overdue: { variant: "destructive" as const, icon: AlertCircle },
      written_off: { variant: "secondary" as const, icon: AlertCircle },
    }
    const style = styles[status]
    const Icon = style.icon
    return (
      <Badge variant={style.variant} className={style.className}>
        <Icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    )
  }

  const stats = {
    totalPayables: debts.filter(d => d.status !== "paid").reduce((sum, d) => sum + d.remainingAmount, 0),
    overdueAmount: debts.filter(d => d.status === 'overdue').reduce((sum, d) => sum + d.remainingAmount, 0),
    suppliersCount: new Set(debts.map(d => d.entityId)).size,
    overdueCount: debts.filter(d => d.status === 'overdue').length,
    dueThisWeek: debts
      .filter((d) => d.status !== "paid" && d.dueDate && d.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, d) => sum + d.remainingAmount, 0),
  }

  const openPayDialog = (debt: PayableDebt) => {
    setSelectedDebt(debt)
    setPaymentAmount(String(debt.remainingAmount.toFixed(2)))
    setPaymentMethod("cash")
    setShowPayDialog(true)
  }

  const handleRecordPayment = async () => {
    if (!selectedDebt || !token) return
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (amount > selectedDebt.remainingAmount) {
      toast.error("Amount exceeds remaining balance")
      return
    }
    setIsSubmitting(true)
    try {
      await apiFetch(`/tenant/debts/${selectedDebt.id}/record-payment`, {
        method: "POST",
        token,
        body: JSON.stringify({ amount, payment_method: paymentMethod }),
      })
      toast.success("Payment recorded successfully")
      setShowPayDialog(false)
      await fetchPayables(true)
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card><CardContent className="h-28" /></Card>
        <Card><CardContent className="h-72" /></Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts Payable</h1>
          <p className="text-muted-foreground">Manage amounts owed to suppliers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchPayables(true)} disabled={isRefreshing}>
            <Clock className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{currency}{stats.totalPayables.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{currency}{stats.overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.overdueCount} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suppliersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency}{stats.dueThisWeek.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payables Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Original</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDebts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No payables found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDebts.map((debt) => (
                  <TableRow key={debt.id}>
                    <TableCell className="font-medium">{debt.entityName}</TableCell>
                    <TableCell>{debt.referenceNumber}</TableCell>
                    <TableCell>{getStatusBadge(debt.status)}</TableCell>
                    <TableCell className="text-right">{currency}{debt.originalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-green-600">{currency}{debt.paidAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-destructive">{currency}{debt.remainingAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      {debt.dueDate ? (
                        <span className={new Date(debt.dueDate) < new Date() ? "text-destructive" : ""}>
                          {new Date(debt.dueDate).toLocaleDateString()}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {debt.status !== "paid" && (
                          <DropdownMenuItem onClick={() => openPayDialog(debt)}>
                            <Banknote className="mr-2 h-4 w-4" />
                            Record Payment
                          </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment to {selectedDebt?.entityName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between text-sm">
                <span>Outstanding Balance</span>
                <span className="font-bold text-destructive">
                  {currency}{selectedDebt?.remainingAmount.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                max={selectedDebt?.remainingAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Coins,
  Calendar,
  User,
  CreditCard,
  Eye,
  Edit,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from 'sonner';
import { listTenantResource, createTenantResource, deleteTenantResource } from '@/lib/api/tenant';
import { StaffSalary, User as StaffUser } from '@/lib/types';
import { format } from 'date-fns';

export default function SalariesPage() {
  const { company, token } = useAuthStore();
  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState<string | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<StaffSalary | null>(null);

  const [newSalary, setNewSalary] = useState({
    staffId: '',
    amount: '',
    paymentMethod: 'cash',
    month: format(new Date(), 'yyyy-MM'),
    notes: '',
  });

  const [editData, setEditData] = useState({
    amount: '',
    paymentMethod: 'cash',
    month: '',
    notes: '',
    status: 'paid' as 'paid' | 'pending' | 'cancelled',
  });

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salariesData, usersData] = await Promise.all([
        listTenantResource<any>('staff_salaries', token!),
        listTenantResource<any>('users', token!),
      ]);

      // Map snake_case from API to camelCase for frontend
      const mappedSalaries: StaffSalary[] = (salariesData || []).map((s: any) => ({
        id: s.id,
        companyId: s.company_id,
        staffId: s.staff_id,
        staffName: s.staff_name,
        amount: s.amount,
        paymentDate: s.payment_date,
        paymentMethod: s.payment_method,
        status: s.status,
        month: s.month,
        notes: s.notes,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));

      const mappedUsers: StaffUser[] = (usersData || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        companyId: u.company_id,
        isActive: u.is_active,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      }));

      setSalaries(mappedSalaries);
      setStaffList(mappedUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load salaries data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalary = async () => {
    if (!newSalary.staffId || !newSalary.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedStaff = staffList.find(s => s.id === newSalary.staffId);
    
    try {
      const payload = {
        staff_id: newSalary.staffId,
        staff_name: selectedStaff?.name || 'Unknown',
        amount: parseFloat(newSalary.amount),
        payment_date: new Date().toISOString(),
        payment_method: newSalary.paymentMethod,
        month: newSalary.month,
        notes: newSalary.notes,
        status: 'paid',
      };

      await createTenantResource('staff_salaries', payload, token!);
      toast.success('Salary record added successfully');
      setAddDialogOpen(false);
      setNewSalary({
        staffId: '',
        amount: '',
        paymentMethod: 'cash',
        month: format(new Date(), 'yyyy-MM'),
        notes: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error adding salary:', error);
      toast.error('Failed to add salary record');
    }
  };

  const handleDelete = async () => {
    if (salaryToDelete) {
      try {
        await deleteTenantResource('staff_salaries', salaryToDelete, token!);
        toast.success('Salary record removed');
        setDeleteDialogOpen(false);
        setSalaryToDelete(null);
        fetchData();
      } catch (error) {
        toast.error('Failed to delete record');
      }
    }
  };

  const handleUpdateSalary = async () => {
    if (!selectedSalary || !editData.amount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      const payload = {
        amount: parseFloat(editData.amount),
        payment_method: editData.paymentMethod,
        month: editData.month,
        notes: editData.notes,
        status: editData.status,
      };

      await updateTenantResource('staff_salaries', selectedSalary.id, payload, token!);
      toast.success('Salary record updated successfully');
      setEditDialogOpen(false);
      setSelectedSalary(null);
      fetchData();
    } catch (error) {
      console.error('Error updating salary:', error);
      toast.error('Failed to update salary record');
    }
  };

  const handlePrintReceipt = (salary: StaffSalary) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Salary Receipt - ${salary.staffName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            .receipt { border: 2px solid #000; padding: 20px; max-width: 500px; margin: auto; }
            .header { text-align: center; border-bottom: 1px solid #eee; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>SALARY PAYMENT RECEIPT</h2>
              <p>${company?.name}</p>
            </div>
            <div class="row">
              <span class="label">Staff Name:</span>
              <span>${salary.staffName}</span>
            </div>
            <div class="row">
              <span class="label">Payment Month:</span>
              <span>${salary.month}</span>
            </div>
            <div class="row">
              <span class="label">Amount Paid:</span>
              <span>${company?.currencySymbol}${salary.amount.toLocaleString()}</span>
            </div>
            <div class="row">
              <span class="label">Payment Date:</span>
              <span>${format(new Date(salary.paymentDate), 'dd MMM yyyy')}</span>
            </div>
            <div class="row">
              <span class="label">Payment Method:</span>
              <span class="capitalize">${salary.paymentMethod}</span>
            </div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="capitalize">${salary.status}</span>
            </div>
            <div class="footer">
              <p>Thank you for your service.</p>
              <p>Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const headers = ['Staff Name', 'Month', 'Amount', 'Date Paid', 'Method', 'Status', 'Notes'];
    const rows = filteredSalaries.map(s => [
      s.staffName,
      s.month,
      s.amount,
      format(new Date(s.paymentDate), 'yyyy-MM-dd'),
      s.paymentMethod,
      s.status,
      s.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `salaries_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSalaries = salaries.filter((s) =>
    (s.staffName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.month || '').includes(searchQuery)
  );

  const stats = {
    totalThisMonth: salaries
      .filter(s => s.month === format(new Date(), 'yyyy-MM'))
      .reduce((sum, s) => sum + s.amount, 0),
    totalYear: salaries.reduce((sum, s) => sum + s.amount, 0),
    count: salaries.length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Salaries</h1>
          <p className="text-muted-foreground">Manage and track staff salary payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total This Month</CardTitle>
            <Coins className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {company?.currencySymbol}{stats.totalThisMonth.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recorded</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {company?.currencySymbol}{stats.totalYear.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
            <User className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all salary payments made to staff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by staff name or month..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date Paid</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredSalaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">No records found</TableCell>
                  </TableRow>
                ) : (
                  filteredSalaries.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.staffName}</TableCell>
                      <TableCell>{s.month}</TableCell>
                      <TableCell>{company?.currencySymbol}{s.amount.toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(s.paymentDate), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {s.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={s.status === 'paid' ? 'default' : s.status === 'pending' ? 'secondary' : 'destructive'}
                          className="capitalize"
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedSalary(s);
                              setViewDialogOpen(true);
                            }}>
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedSalary(s);
                              setEditData({
                                amount: s.amount.toString(),
                                paymentMethod: s.paymentMethod,
                                month: s.month,
                                notes: s.notes || '',
                                status: s.status as any,
                              });
                              setEditDialogOpen(true);
                            }}>
                              <Edit className="mr-2 size-4" />
                              Edit Record
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintReceipt(s)}>
                              <Printer className="mr-2 size-4" />
                              Print Receipt
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSalaryToDelete(s.id);
                                setDeleteDialogOpen(true);
                              }}
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

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Salary Payment</DialogTitle>
            <DialogDescription>Enter the details for the staff salary payment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Staff Member</FieldLabel>
              <Select
                value={newSalary.staffId}
                onValueChange={(v) => setNewSalary({ ...newSalary, staffId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Amount ({company?.currencySymbol})</FieldLabel>
              <Input
                type="number"
                placeholder="0.00"
                value={newSalary.amount}
                onChange={(e) => setNewSalary({ ...newSalary, amount: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Payment Month</FieldLabel>
                <Input
                  type="month"
                  value={newSalary.month}
                  onChange={(e) => setNewSalary({ ...newSalary, month: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Method</FieldLabel>
                <Select
                  value={newSalary.paymentMethod}
                  onValueChange={(v) => setNewSalary({ ...newSalary, paymentMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile">Mobile Money</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel>Notes (Optional)</FieldLabel>
              <Input
                placeholder="e.g. Overtime included"
                value={newSalary.notes}
                onChange={(e) => setNewSalary({ ...newSalary, notes: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSalary}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Salary Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this salary record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salary Payment Details</DialogTitle>
            <DialogDescription>
              Full information for this salary record.
            </DialogDescription>
          </DialogHeader>
          {selectedSalary && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Staff Name</p>
                  <p className="font-semibold">{selectedSalary.staffName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Payment Month</p>
                  <p className="font-semibold">{selectedSalary.month}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Amount Paid</p>
                  <p className="font-semibold text-primary">
                    {company?.currencySymbol}{selectedSalary.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <Badge variant={selectedSalary.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                    {selectedSalary.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Payment Date</p>
                  <p className="font-semibold">
                    {format(new Date(selectedSalary.paymentDate), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Method</p>
                  <p className="font-semibold capitalize">{selectedSalary.paymentMethod}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Notes</p>
                <p className="text-sm bg-muted p-2 rounded-md mt-1">
                  {selectedSalary.notes || 'No notes provided.'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedSalary && handlePrintReceipt(selectedSalary)}>
              <Printer className="mr-2 size-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Salary Record</DialogTitle>
            <DialogDescription>Update the details for this salary payment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Staff Member</FieldLabel>
              <Input value={selectedSalary?.staffName} disabled className="bg-muted" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Amount ({company?.currencySymbol})</FieldLabel>
                <Input
                  type="number"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={editData.status}
                  onValueChange={(v: any) => setEditData({ ...editData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Payment Month</FieldLabel>
                <Input
                  type="month"
                  value={editData.month}
                  onChange={(e) => setEditData({ ...editData, month: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Method</FieldLabel>
                <Select
                  value={editData.paymentMethod}
                  onValueChange={(v) => setEditData({ ...editData, paymentMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile">Mobile Money</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Input
                placeholder="Optional notes..."
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSalary}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

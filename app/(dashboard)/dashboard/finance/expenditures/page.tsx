'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Wallet,
  Calendar,
  Tag,
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
import { Expenditure } from '@/lib/types';
import { format } from 'date-fns';

export default function ExpendituresPage() {
  const { company, token } = useAuthStore();
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expToDelete, setExpToDelete] = useState<string | null>(null);

  const [newExp, setNewExp] = useState({
    category: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    description: '',
    referenceNumber: '',
  });

  const categories = [
    'Rent',
    'Electricity',
    'Water',
    'Internet',
    'Supplies',
    'Maintenance',
    'Marketing',
    'Transport',
    'Others',
  ];

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await listTenantResource<Expenditure>('expenditures', token!);
      setExpenditures(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load expenditures data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExp = async () => {
    if (!newExp.category || !newExp.amount || !newExp.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        category: newExp.category,
        amount: parseFloat(newExp.amount),
        date: new Date(newExp.date).toISOString(),
        payment_method: newExp.paymentMethod,
        description: newExp.description,
        reference_number: newExp.referenceNumber,
      };

      await createTenantResource('expenditures', payload, token!);
      toast.success('Expenditure record added successfully');
      setAddDialogOpen(false);
      setNewExp({
        category: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        description: '',
        referenceNumber: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error adding expenditure:', error);
      toast.error('Failed to add expenditure record');
    }
  };

  const handleDelete = async () => {
    if (expToDelete) {
      try {
        await deleteTenantResource('expenditures', expToDelete, token!);
        toast.success('Expenditure record removed');
        setDeleteDialogOpen(false);
        setExpToDelete(null);
        fetchData();
      } catch (error) {
        toast.error('Failed to delete record');
      }
    }
  };

  const filteredExp = expenditures.filter((e) =>
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalThisMonth: expenditures
      .filter(e => format(new Date(e.date), 'yyyy-MM') === format(new Date(), 'yyyy-MM'))
      .reduce((sum, e) => sum + e.amount, 0),
    totalOverall: expenditures.reduce((sum, e) => sum + e.amount, 0),
    count: expenditures.length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenditures</h1>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add Expenditure
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total This Month</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {company?.currencySymbol}{stats.totalThisMonth.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Overall</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {company?.currencySymbol}{stats.totalOverall.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            <Tag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>View all business expenditures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by category or description..."
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
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Ref #</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredExp.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">No records found</TableCell>
                  </TableRow>
                ) : (
                  filteredExp.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">{e.category}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(e.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{company?.currencySymbol}{e.amount.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{e.paymentMethod}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{e.description || '-'}</TableCell>
                      <TableCell>{e.referenceNumber || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setExpToDelete(e.id);
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
            <DialogTitle>Add Expenditure</DialogTitle>
            <DialogDescription>Enter the details for the business expense.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select
                value={newExp.category}
                onValueChange={(v) => setNewExp({ ...newExp, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Amount ({company?.currencySymbol})</FieldLabel>
              <Input
                type="number"
                placeholder="0.00"
                value={newExp.amount}
                onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="date"
                  value={newExp.date}
                  onChange={(e) => setNewExp({ ...newExp, date: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Method</FieldLabel>
                <Select
                  value={newExp.paymentMethod}
                  onValueChange={(v) => setNewExp({ ...newExp, paymentMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile">Mobile Money</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="credit">Credit/Debt</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Input
                placeholder="e.g. Electricity bill for March"
                value={newExp.description}
                onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Reference # (Optional)</FieldLabel>
              <Input
                placeholder="Receipt or Invoice number"
                value={newExp.referenceNumber}
                onChange={(e) => setNewExp({ ...newExp, referenceNumber: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExp}>Save Expenditure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expenditure record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

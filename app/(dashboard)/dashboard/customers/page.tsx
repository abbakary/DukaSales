'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Users,
  CreditCard,
  Star,
  Phone,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldGroup, FieldError } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import { createTenantResource, updateTenantResource } from '@/lib/api/tenant';
import { syncTenantDataFromApi } from '@/lib/services/sync-from-api';
import { toast } from 'sonner';

const priceLevelColors: Record<string, string> = {
  regular: 'bg-muted text-muted-foreground',
  wholesale: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  vip: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

export default function CustomersPage() {
  const { company, token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    vrnNo: '',
    region: '',
    city: '',
    creditLimit: 500,
    priceLevel: 'regular' as 'regular' | 'wholesale' | 'vip',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const customers = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.customers.where('companyId').equals(company.id).toArray();
    },
    [company?.id],
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const filteredCustomers = (customers || []).filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || customer.priceLevel === levelFilter;
    return matchesSearch && matchesLevel && customer.isActive;
  });

  const stats = {
    total: customers?.filter(c => c.isActive).length || 0,
    withDebt: customers?.filter(c => c.currentDebt > 0 && c.isActive).length || 0,
    totalDebt: customers?.reduce((sum, c) => sum + (c.currentDebt || 0), 0) || 0,
    vipCount: customers?.filter(c => c.priceLevel === 'vip' && c.isActive).length || 0,
  };

  const handleAddCustomer = async () => {
    const errors: Record<string, string> = {};
    if (!newCustomer.name.trim()) errors.name = 'Name is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!token) {
      toast.error('Session expired. Please login again.');
      return;
    }

    await createTenantResource(
      'customers',
      {
        name: newCustomer.name,
        phone: newCustomer.phone || null,
        email: newCustomer.email || null,
        physical_address: newCustomer.address || null,
        tax_id: newCustomer.taxId || null,
        vrn_no: newCustomer.vrnNo || null,
        region: newCustomer.region || null,
        city: newCustomer.city || null,
        credit_limit: newCustomer.creditLimit,
        current_debt: 0,
        is_active: true,
      },
      token
    );
    await syncTenantDataFromApi(token);

    toast.success('Customer added successfully');
    setAddDialogOpen(false);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      vrnNo: '',
      region: '',
      city: '',
      creditLimit: 500,
      priceLevel: 'regular',
    });
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (customerToDelete && token) {
      await updateTenantResource('customers', customerToDelete, { is_active: false }, token);
      await syncTenantDataFromApi(token);
      toast.success('Customer deleted successfully');
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Debit Customers</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withDebt}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {company?.currencySymbol}{stats.totalDebt.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">VIP Customers</CardTitle>
            <Star className="size-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vipCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>{filteredCustomers.length} customers found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Credit Limit</TableHead>
                  <TableHead className="text-right">Account Status</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.address && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{customer.address}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="size-3 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="size-3 text-muted-foreground" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={priceLevelColors[customer.priceLevel || 'regular']}>
                          {customer.priceLevel || 'regular'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {company?.currencySymbol}{customer.creditLimit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-sm font-medium ${customer.currentDebt > 0 ? 'text-red-600' : customer.currentDebt < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {customer.currentDebt > 0 ? 'Debit' : customer.currentDebt < 0 ? 'Credit' : 'Balanced'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {company?.currencySymbol}{Math.abs(customer.currentDebt).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{customer.loyaltyPoints}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setCustomerToDelete(customer.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
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

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Add a new customer to your database</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Name *</FieldLabel>
              <Input
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
              {formErrors.name && <FieldError>{formErrors.name}</FieldError>}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input
                  placeholder="Phone number"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Physical Address</FieldLabel>
              <Input
                placeholder="Physical address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>TIN (Tax ID)</FieldLabel>
                <Input
                  placeholder="TIN number"
                  value={newCustomer.taxId}
                  onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>VRN No.</FieldLabel>
                <Input
                  placeholder="VRN number"
                  value={newCustomer.vrnNo}
                  onChange={(e) => setNewCustomer({ ...newCustomer, vrnNo: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Region</FieldLabel>
                <Input
                  placeholder="Region"
                  value={newCustomer.region}
                  onChange={(e) => setNewCustomer({ ...newCustomer, region: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>City</FieldLabel>
                <Input
                  placeholder="City"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Credit Limit</FieldLabel>
                <Input
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                />
              </Field>
              <Field>
                <FieldLabel>Price Level</FieldLabel>
                <Select
                  value={newCustomer.priceLevel}
                  onValueChange={(v) => setNewCustomer({ ...newCustomer, priceLevel: v as 'regular' | 'wholesale' | 'vip' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer}>
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

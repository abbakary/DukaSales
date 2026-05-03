'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  Mail,
  Phone,
  UserCog,
  Users,
  Activity,
  Clock,
  Loader2,
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
import { Field, FieldLabel, FieldGroup, FieldError, FieldDescription } from '@/components/ui/field';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from 'sonner';
import { listTenantResource, createTenantResource, updateTenantResource, deleteTenantResource } from '@/lib/api/tenant';

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  cashier: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const rolePermissions: Record<string, string[]> = {
  admin: ['All permissions', 'User management', 'Reports', 'Settings'],
  manager: ['Inventory', 'Sales', 'Purchases', 'Reports', 'Staff view'],
  cashier: ['POS', 'Basic sales', 'View inventory'],
};

export default function StaffPage() {
  const { user, company, token } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchStaff = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await listTenantResource<any>('users', token);
      setStaff(data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filteredStaff = staff.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.is_active).length,
    admins: staff.filter(s => s.role === 'admin').length,
    totalSales: staff.reduce((sum, s) => sum + (s.salesTotal || 0), 0),
  };

  const handleAddStaff = async () => {
    const errors: Record<string, string> = {};
    if (!newStaff.name.trim()) errors.name = 'Name is required';
    if (!newStaff.email.trim()) errors.email = 'Email is required';
    if (!newStaff.password.trim()) errors.password = 'Password is required';
    if (newStaff.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await createTenantResource('users', {
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        password: newStaff.password,
        is_active: true,
      }, token!);

      toast.success('Staff member added successfully');
      setAddDialogOpen(false);
      setNewStaff({ name: '', email: '', phone: '', role: 'cashier', password: '' });
      setFormErrors({});
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add staff member');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateTenantResource('users', id, {
        is_active: !currentStatus
      }, token!);
      toast.success('Staff status updated');
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (staffToDelete) {
      try {
        await deleteTenantResource('users', staffToDelete, token!);
        toast.success('Staff member removed');
        setDeleteDialogOpen(false);
        setStaffToDelete(null);
        fetchStaff();
      } catch (error: any) {
        toast.error(error.message || 'Failed to remove staff member');
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage your team members and their permissions</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Staff
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <Activity className="size-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <UserCog className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {company?.currencySymbol}{stats.totalSales.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>{filteredStaff.length} staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
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
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead>Joined At</TableHead>
                  {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Loading staff members...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center text-muted-foreground">
                      No staff members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={roleColors[member.role]}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.is_active ? 'default' : 'secondary'}
                          className={member.is_active ? 'bg-success text-success-foreground' : ''}
                        >
                          {member.is_active ? 'active' : 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">{company?.currencySymbol}{(member.salesTotal || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{member.salesCount || 0} transactions</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="size-3" />
                          {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleStatus(member.id, member.is_active)}>
                                {member.is_active ? (
                                  <>
                                    <ShieldOff className="mr-2 size-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Shield className="mr-2 size-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStaffToDelete(member.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Overview of what each role can access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <div key={role} className="border rounded-lg p-4">
                <Badge variant="secondary" className={`${roleColors[role]} mb-3`}>
                  {role}
                </Badge>
                <ul className="space-y-1">
                  {permissions.map((perm, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-muted-foreground" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Add a new team member to your company</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Full Name *</FieldLabel>
              <Input
                placeholder="Enter full name"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              />
              {formErrors.name && <FieldError>{formErrors.name}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Email *</FieldLabel>
              <Input
                type="email"
                placeholder="Email address"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              />
              {formErrors.email && <FieldError>{formErrors.email}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Password *</FieldLabel>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              />
              <FieldDescription>This will be the login password</FieldDescription>
              {formErrors.password && <FieldError>{formErrors.password}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStaff}>
              Add Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this staff member? They will lose access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

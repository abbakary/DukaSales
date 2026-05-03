'use client';

import { useState, useEffect } from 'react';
import { Search, MoreHorizontal, Shield, ShieldOff, Mail, Users, UserCog, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/auth-store';
import { listAdminUsersApi, toggleAdminUserStatusApi, AdminUser } from '@/lib/api/admin-users';

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  cashier: 'bg-green-100 text-green-800',
  super_admin: 'bg-red-100 text-red-800',
};

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!token) return;
    listAdminUsersApi(token)
      .then(data => setUsers(data))
      .catch(err => {
        toast.error('Failed to load users');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = users.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.company && u.company.toLowerCase().includes(search.toLowerCase()))) &&
    (roleFilter === 'all' || u.role === roleFilter) &&
    (statusFilter === 'all' || u.status === statusFilter)
  );

  const toggleStatus = async (id: string) => {
    if (!token) return;
    try {
      const res = await toggleAdminUserStatusApi(id, token);
      setUsers(users.map(u => u.id === id ? { ...u, status: res.status } : u));
      toast.success('User status updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Users</h1>
        <p className="text-muted-foreground">Manage all users across all companies</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="size-8 text-primary" /><div><div className="text-2xl font-bold">{users.length}</div><p className="text-sm text-muted-foreground">Total Users</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Activity className="size-8 text-green-600" /><div><div className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</div><p className="text-sm text-muted-foreground">Active</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><UserCog className="size-8 text-purple-600" /><div><div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div><p className="text-sm text-muted-foreground">Admins</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><ShieldOff className="size-8 text-destructive" /><div><div className="text-2xl font-bold text-destructive">{users.filter(u => u.status === 'suspended').length}</div><p className="text-sm text-muted-foreground">Suspended</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>All Users</CardTitle><CardDescription>{filtered.length} users found</CardDescription></div>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-48" /></div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-28"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading users...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8"><AvatarFallback className="bg-primary/10 text-primary text-xs">{u.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                      <div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{u.company}</TableCell>
                  <TableCell><Badge variant="secondary" className={roleColors[u.role] || 'bg-gray-100 text-gray-800'}>{u.role}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{u.plan || 'none'}</Badge></TableCell>
                  <TableCell><Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{u.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewUser(u)}><Shield className="mr-2 size-4" />View Details</DropdownMenuItem>
                        <DropdownMenuItem><Mail className="mr-2 size-4" />Send Email</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleStatus(u.id)}>
                          {u.status === 'active' ? <><ShieldOff className="mr-2 size-4" />Suspend</> : <><Shield className="mr-2 size-4" />Activate</>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Avatar className="size-12"><AvatarFallback className="bg-primary/10 text-primary">{viewUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div><p className="font-semibold text-base">{viewUser.name}</p><p className="text-muted-foreground">{viewUser.email}</p></div>
              </div>
              {[['Company', viewUser.company], ['Role', viewUser.role], ['Plan', viewUser.plan || 'none'], ['Status', viewUser.status], ['Last Login', viewUser.lastLogin ? new Date(viewUser.lastLogin).toLocaleString() : 'Never']].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium capitalize">{v}</span></div>
              ))}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewUser(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

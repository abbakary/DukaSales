'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Power,
  Trash2,
  Users,
  Package,
  Receipt,
  Banknote,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  ExternalLink,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/auth-store';
import { 
  getCompanyApi, 
  getCompanyStatsApi, 
  getCompanyUsersApi, 
  getCompanyTransactionsApi,
  toggleCompanyStatusApi,
  deleteCompanyApi
} from '@/lib/api/admin-companies';

const businessTypeLabels: Record<string, string> = {
  retail: 'Retail Store',
  pharmacy: 'Pharmacy',
  building: 'Building Materials',
  wholesale: 'Wholesale',
};

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!token || !id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch company details
        const companyData = await getCompanyApi(id, token);
        setCompany(companyData);
        
        // Fetch company stats
        const statsData = await getCompanyStatsApi(id, token);
        setStats(statsData);
        
        // Fetch company users
        const usersData = await getCompanyUsersApi(id, token);
        setUsers(usersData);
        
        // Fetch company transactions
        const transactionsData = await getCompanyTransactionsApi(id, token);
        setTransactions(transactionsData);
        
      } catch (error) {
        console.error('Error fetching company data:', error);
        toast.error('Failed to load company data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id]);

  const handleDelete = async () => {
    if (!company || !company.id) return;
    
    try {
      await deleteCompanyApi(company.id, token);
      toast.success('Company deleted successfully');
      router.push('/admin/companies');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  const handleToggleStatus = async () => {
    if (!company || !company.id) return;
    
    try {
      const updatedCompany = await toggleCompanyStatusApi(company.id, token);
      setCompany(updatedCompany);
      toast.success(`Company ${updatedCompany.isActive ? 'activated' : 'suspended'} successfully`);
      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Error toggling company status:', error);
      toast.error('Failed to update company status');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <p>Company not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/companies">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {company.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground">{company.email}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/companies/${company.id}/edit`}>
              <Edit className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusDialogOpen(true)}>
                <Power className="mr-2 size-4" />
                {company.isActive ? 'Suspend' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.products || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.transactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Banknote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TSh {stats?.revenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Type:</span>
                  <div className="flex flex-wrap gap-1">
                    {company.types?.map((type: string) => (
                      <Badge key={type} variant="secondary">
                        {businessTypeLabels[type as keyof typeof businessTypeLabels] || type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{company.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{company.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Address:</span>
                  <span className="text-sm">{company.physical_address || company.address}</span>
                </div>
                {company.vrn_no && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">VRN:</span>
                    <span className="text-sm">{company.vrn_no}</span>
                  </div>
                )}
                {company.tin_no && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">TIN:</span>
                    <span className="text-sm">{company.tin_no}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Website:</span>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {company.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Details */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Current subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {company.subscriptionPlan}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{new Date(company.createdAt).toLocaleDateString()}</span>
                </div>
                {company.subscriptionExpiry && (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Expires:</span>
                    <span className="text-sm">{new Date(company.subscriptionExpiry).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={company.isActive ? 'default' : 'secondary'}>
                    {company.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <BarChart3 className="size-5" />
                <span>View Analytics</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <Users className="size-5" />
                <span>Manage Users</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <Settings className="size-5" />
                <span>Settings</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <ExternalLink className="size-5" />
                <span>Login as Admin</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>{users.length} users in this company</CardDescription>
              </div>
              <Button size="sm">Add User</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest transactions from this company</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn: any) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-medium">{txn.transaction_number}</TableCell>
                      <TableCell>{txn.customer_name}</TableCell>
                      <TableCell>TSh {txn.total?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(txn.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Payment history for this company</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBilling.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>{bill.date}</TableCell>
                      <TableCell>{bill.description}</TableCell>
                      <TableCell>TSh {bill.amount}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-success text-success-foreground">
                          {bill.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Toggle Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {company?.isActive ? 'Suspend Company' : 'Activate Company'}
            </DialogTitle>
            <DialogDescription>
              {company?.isActive
                ? 'This will prevent all users from accessing the platform. The company data will be preserved.'
                : 'This will allow all users to access the platform again.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={company?.isActive ? 'destructive' : 'default'}
              onClick={handleToggleStatus}
            >
              {company?.isActive ? 'Suspend' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company? This action cannot be undone and will permanently remove all data including users, products, and transactions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Power,
  Download,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { listCompaniesApi } from '@/lib/api/admin-companies';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getFullImageUrl } from '@/lib/utils';

const businessTypeColors: Record<string, string> = {
  retail: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  pharmacy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  building: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  wholesale: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const statusIcons: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="size-4 text-success" />,
  pending: <Clock className="size-4 text-warning" />,
  suspended: <XCircle className="size-4 text-destructive" />,
};

interface CompanyRow {
  id: string;
  name: string;
  email: string;
  logo: string | null;
  types: string[];
  plan: string;
  status: string;
  users: number;
  products: number;
  sales: number;
  createdAt: string;
}

export default function CompaniesPage() {
  const { token } = useAuthStore();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listCompaniesApi(token)
      .then((rows) => {
        setCompanies(rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email || '',
          logo: row.logo || null,
          types: row.types || [],
          plan: row.subscriptionPlan,
          status: row.isActive ? 'active' : 'suspended',
          users: 0,
          products: 0,
          sales: 0,
          createdAt: String(row.createdAt),
        })));
      })
      .catch((error) => {
        toast.error(error.message || 'Failed to load companies');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || (company.types as string[]).includes(typeFilter);
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(filteredCompanies.map(c => c.id));
    } else {
      setSelectedCompanies([]);
    }
  };

  const handleSelectCompany = (companyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, companyId]);
    } else {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    }
  };

  const handleDelete = (companyId: string) => {
    setCompanyToDelete(companyId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    toast.success('Company deleted successfully');
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const handleToggleStatus = (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    toast.success(`Company ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground">
            Manage all registered businesses on the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/admin/companies/new">
              <Plus className="mr-2 size-4" />
              Add Company
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {companies.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {companies.filter(c => c.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {companies.filter(c => c.status === 'suspended').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>
            {filteredCompanies.length} companies found
            {selectedCompanies.length > 0 && ` - ${selectedCompanies.length} selected`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="p-0 h-auto font-medium">
                      Company
                      <ArrowUpDown className="ml-2 size-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={(checked) => handleSelectCompany(company.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border">
                          {company.logo ? (
                            <img src={getFullImageUrl(company.logo)} alt={company.name} className="h-full w-full object-contain p-1" />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {company.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">{company.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(company.types as string[]).map(type => (
                          <Badge key={type} variant="secondary" className={businessTypeColors[type]}>
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {company.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {statusIcons[company.status]}
                        <span className="capitalize">{company.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{company.users}</TableCell>
                    <TableCell className="text-right">{company.products}</TableCell>
                    <TableCell className="text-right">TSh {company.sales.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/companies/${company.id}`}>
                              <Eye className="mr-2 size-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/companies/${company.id}/edit`}>
                              <Edit className="mr-2 size-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(company.id, company.status)}>
                            <Power className="mr-2 size-4" />
                            {company.status === 'active' ? 'Suspend' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(company.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company? This action cannot be undone and will remove all associated data including users, products, and transactions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

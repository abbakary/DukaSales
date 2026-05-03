'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  X,
  Eye,
  Clock,
  Building2,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Mock pending companies
const mockPendingCompanies = [
  {
    id: '1',
    name: 'New Tech Store',
    email: 'contact@newtechstore.com',
    phone: '+1 (555) 111-2222',
    types: ['retail'],
    plan: 'pro',
    adminName: 'Alice Johnson',
    adminEmail: 'alice@newtechstore.com',
    submittedAt: '2024-02-10 14:30',
    notes: 'Looking forward to using your platform for our electronics store.',
  },
  {
    id: '2',
    name: 'Green Pharmacy Plus',
    email: 'admin@greenpharmacy.com',
    phone: '+1 (555) 333-4444',
    types: ['pharmacy'],
    plan: 'enterprise',
    adminName: 'Dr. Robert Smith',
    adminEmail: 'robert@greenpharmacy.com',
    submittedAt: '2024-02-09 09:15',
    notes: 'We have 3 pharmacy locations and need batch/expiry tracking.',
  },
  {
    id: '3',
    name: 'BuildMaster Supplies',
    email: 'info@buildmaster.com',
    phone: '+1 (555) 555-6666',
    types: ['building'],
    plan: 'basic',
    adminName: 'Mike Wilson',
    adminEmail: 'mike@buildmaster.com',
    submittedAt: '2024-02-08 16:45',
    notes: 'Construction materials store, need weight and length unit support.',
  },
  {
    id: '4',
    name: 'Hybrid Solutions',
    email: 'hello@hybrid.com',
    phone: '+1 (555) 777-8888',
    types: ['retail', 'pharmacy'],
    plan: 'enterprise',
    adminName: 'Sam Hybrid',
    adminEmail: 'sam@hybrid.com',
    submittedAt: '2024-02-11 10:00',
    notes: 'Supermarket with a pharmacy section.',
  },
];

const businessTypeLabels: Record<string, string> = {
  retail: 'Retail Store',
  pharmacy: 'Pharmacy',
  building: 'Building Materials',
  wholesale: 'Wholesale',
};

const businessTypeColors: Record<string, string> = {
  retail: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  pharmacy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  building: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  wholesale: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

export default function PendingCompaniesPage() {
  const [companies, setCompanies] = useState(mockPendingCompanies);
  const [selectedCompany, setSelectedCompany] = useState<typeof mockPendingCompanies[0] | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    if (selectedCompany) {
      setCompanies(companies.filter(c => c.id !== selectedCompany.id));
      toast.success(`${selectedCompany.name} has been approved successfully`);
      setApproveDialogOpen(false);
      setSelectedCompany(null);
    }
  };

  const handleReject = () => {
    if (selectedCompany) {
      setCompanies(companies.filter(c => c.id !== selectedCompany.id));
      toast.success(`${selectedCompany.name} has been rejected`);
      setRejectDialogOpen(false);
      setSelectedCompany(null);
      setRejectReason('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/companies">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pending Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve new company registrations
          </p>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-warning" />
            <CardTitle className="text-lg">{companies.length} Pending Requests</CardTitle>
          </div>
        </CardHeader>
      </Card>

      {/* Pending Companies List */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Check className="size-12 text-success mb-4" />
            <h3 className="text-lg font-semibold">All caught up!</h3>
            <p className="text-muted-foreground">No pending company registrations to review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="size-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {company.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{company.name}</h3>
                          <div className="flex gap-1">
                            {company.types.map(type => (
                              <Badge key={type} variant="secondary" className={businessTypeColors[type]}>
                                {businessTypeLabels[type]}
                              </Badge>
                            ))}
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {company.plan}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{company.notes}</p>
                      </div>
                      
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="size-4 text-muted-foreground" />
                          <span>{company.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="size-4 text-muted-foreground" />
                          <span>{company.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-muted-foreground" />
                          <span>{company.adminName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-muted-foreground" />
                          <span>{company.submittedAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 lg:flex-col">
                    <Button
                      variant="default"
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => {
                        setSelectedCompany(company);
                        setApproveDialogOpen(true);
                      }}
                    >
                      <Check className="mr-2 size-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedCompany(company);
                        setRejectDialogOpen(true);
                      }}
                    >
                      <X className="mr-2 size-4" />
                      Reject
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/companies/${company.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedCompany?.name}? They will be able to access the platform immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-success hover:bg-success/90" onClick={handleApprove}>
              <Check className="mr-2 size-4" />
              Approve Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedCompany?.name}? Please provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <X className="mr-2 size-4" />
              Reject Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

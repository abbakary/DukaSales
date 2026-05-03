'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const id = setTimeout(() => router.replace('/login'), 0);
      return () => clearTimeout(id);
      return;
    }
    // Only super_admin can access /admin
    if (user?.role !== 'super_admin') {
      const id = setTimeout(() => router.replace('/dashboard'), 0);
      return () => clearTimeout(id);
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'super_admin') return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarInset className="flex flex-col min-h-0">
        <AdminHeader />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
      <AdminSidebar side="right" />
    </SidebarProvider>
  );
}

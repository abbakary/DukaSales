'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/app-sidebar';
import { AppHeader } from '@/components/shared/app-header';
import { allNavItems } from '@/lib/config/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const id = setTimeout(() => router.replace('/login'), 0);
      return () => clearTimeout(id);
      return;
    }
    // Super admin should not be in the shop dashboard
    if (!isLoading && isAuthenticated && user?.role === 'super_admin') {
      const id = setTimeout(() => router.replace('/admin'), 0);
      return () => clearTimeout(id);
      return;
    }

    // Role-based route protection
    if (!isLoading && isAuthenticated && user) {
      const currentNavItem = allNavItems.find(item => 
        pathname.startsWith(item.url)
      );

      if (currentNavItem?.roles && !currentNavItem.roles.includes(user.role)) {
        const id = setTimeout(() => router.replace('/dashboard'), 0);
        return () => clearTimeout(id);
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role === 'super_admin') {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-0 overflow-hidden">
        <AppHeader />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

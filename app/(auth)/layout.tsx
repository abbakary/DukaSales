'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Defer router actions one tick to avoid App Router init race during Fast Refresh.
      const id = setTimeout(() => {
        if (user?.role === 'super_admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      }, 0);
      return () => clearTimeout(id);
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return <>{children}</>;
}

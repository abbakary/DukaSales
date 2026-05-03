'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    // Defer router actions one tick to avoid App Router init race during Fast Refresh.
    const id = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role === 'super_admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }, 0);
    return () => clearTimeout(id);
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

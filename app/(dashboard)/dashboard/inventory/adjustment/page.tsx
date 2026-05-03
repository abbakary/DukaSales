'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryAdjustmentAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/inventory/adjustments');
  }, [router]);

  return null;
}

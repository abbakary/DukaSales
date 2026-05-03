'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Registration is disabled — shops are created by the Super Admin only.
// Redirect anyone who lands here back to login.
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return null;
}

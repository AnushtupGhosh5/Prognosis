'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '../components/AuthForm';
import { onAuthStateChange } from '../lib/firebase';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // User is signed in, redirect to dashboard
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleAuthSuccess = (userInfo) => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg to-elevated">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg to-elevated">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical"></div>
      </div>
    );
  }

  return <AuthForm onAuthSuccess={handleAuthSuccess} />;
}

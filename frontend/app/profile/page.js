'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import UserProfile from '../../components/UserProfile';
import axios from 'axios';
import { onAuthStateChange, getUserToken } from '../../lib/firebase';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setUser(user);
        // Get user info from localStorage
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        setUser({ ...user, ...userInfo });
        fetchSessions();
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchSessions = async () => {
    try {
      setError('');
      const token = await getUserToken();
      if (!token) return;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await axios.get(`${API_BASE_URL}/api/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(response.data.sessions || []);
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Profile sessions error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar user={user} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar user={user} />
      
      {/* Main Content */}
      <div className="pt-6 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
              👤 My Profile
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Track your medical training progress and achievements
            </p>
          </div>

          {/* Profile Component */}
          <UserProfile sessions={sessions} />
          {error && (
            <p className="mt-4 text-sm text-error">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

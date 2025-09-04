'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import { updateUserScore } from '../../../lib/leaderboard';
import { onAuthStateChange, getUserToken } from '../../../lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Feedback({ params }) {
  const [user, setUser] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const sessionId = use(params).id;

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setUser(user);
        // Get user info from localStorage
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        setUser({ ...user, ...userInfo });
        fetchSessionData();
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, sessionId]);

  const fetchSessionData = async () => {
    try {
      const token = await getUserToken();
      if (!token) {
        router.push('/');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSessionData(response.data);
      
      // If session is not completed, redirect to simulation
      if (response.data.status !== 'completed') {
        router.push(`/simulation/${sessionId}`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Session not found');
      } else {
        setError('Failed to load session data');
      }
      console.error('Fetch session error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Persist the score to Firestore when session data is loaded and completed
  useEffect(() => {
    if (!sessionData || sessionData.status !== 'completed' || !user) return;
    const uid = user?.uid; // Firebase Auth UID (custom token or social)
    const s = Number(sessionData.score);
    if (!uid || !(s >= 0)) return;
    // Fire-and-forget; errors are non-blocking for UI
    updateUserScore(uid, s).catch((e) => {
      console.warn('Failed to update user score:', e);
    });
  }, [sessionData, user]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    let date;
    
    // Handle different timestamp formats
    if (timestamp.seconds) {
      // Firebase Timestamp format
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      // ISO string format
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else {
      return 'Unknown';
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startNewCase = async () => {
    try {
      const token = await getUserToken();
      if (!token) {
        router.push('/');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/case/start`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const { session_id } = response.data;
      router.push(`/simulation/${session_id}`);
    } catch (err) {
      console.error('Start new case error:', err);
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

  if (error) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar user={user} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="border border-error/20 bg-error/10 rounded-md p-6">
            <h2 className="text-lg font-medium text-error mb-2">Error</h2>
            <p className="text-error">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 btn-primary text-sm"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar user={user} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Session not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`${getScoreBadgeColor(sessionData.score)} text-white rounded-full p-4`}>
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Case Complete!</h1>
          <p className="text-lg text-muted-foreground">
            Patient: {sessionData.case.patient_name} • {sessionData.case.chief_complaint}
          </p>
          <div className="mt-4">
            <span className={`text-4xl font-bold ${getScoreColor(sessionData.score)}`}>
              {sessionData.score}/100
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Your Submission */}
          <div className="card">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <svg className="h-5 w-5 text-medical mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Submission
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Diagnosis</h4>
                <p className="text-foreground/90 bg-elevated/40 border border-border p-3 rounded-md">{sessionData.diagnosis}</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Treatment Plan</h4>
                <p className="text-foreground/90 bg-elevated/40 border border-border p-3 rounded-md">{sessionData.treatment}</p>
              </div>
            </div>
          </div>

          {/* Case Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <svg className="h-5 w-5 text-medical mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Case Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-foreground">Patient:</span>
                <span className="ml-2 text-muted-foreground">
                  {sessionData.case.patient_name}, {sessionData.case.age}-year-old {sessionData.case.gender}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground">Chief Complaint:</span>
                <span className="ml-2 text-muted-foreground">{sessionData.case.chief_complaint}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Completed:</span>
                <span className="ml-2 text-muted-foreground">{formatDate(sessionData.completed_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Feedback */}
        <div className="card mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <svg className="h-6 w-6 text-medical mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
            </svg>
            AI Feedback & Learning Points
          </h3>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {sessionData.feedback}
            </div>
          </div>
        </div>

        {/* Chat History */}
        {sessionData.chat_history && sessionData.chat_history.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <svg className="h-6 w-6 text-medical mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Patient Interview History
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sessionData.chat_history.map((entry, index) => (
                <div key={index} className="border-l-4 border-border pl-4">
                  <div className="mb-2">
                    <span className="font-medium text-medical">You:</span>
                    <p className="text-foreground/90 mt-1">{entry.user_input}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Patient:</span>
                    <p className="text-muted-foreground mt-1">{entry.ai_response}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary px-6 py-3 text-sm"
          >
            Return to Dashboard
          </button>
          <button
            onClick={startNewCase}
            className="btn-primary px-6 py-3 text-sm"
          >
            Start New Case
          </button>
        </div>
      </div>
    </div>
  );
}

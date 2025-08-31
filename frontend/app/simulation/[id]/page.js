'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import ChatWindow from '../../../components/ChatWindow';
import CaseDetailsPanel from '../../../components/CaseDetailsPanel';
import FeedbackModal from '../../../components/FeedbackModal';
import { onAuthStateChange, getUserToken } from '../../../lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Simulation({ params }) {
  const [user, setUser] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
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
      
      // If session is already completed, redirect to feedback
      if (response.data.status === 'completed') {
        router.push(`/feedback/${sessionId}`);
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

  const handleSubmitDiagnosis = async (diagnosis, treatment) => {
    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/case/submit`,
        {
          session_id: sessionId,
          diagnosis,
          treatment
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to submit diagnosis');
    }
  };

  const openFeedbackModal = () => {
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Medical Case Simulation
              </h1>
              <p className="text-muted-foreground mt-1">
                Conduct your patient interview and formulate a diagnosis
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Exit Simulation
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat Window */}
          <div className="lg:col-span-2 flex flex-col">
            <ChatWindow 
              sessionId={sessionId} 
              onSubmitDiagnosis={openFeedbackModal}
            />
          </div>

          {/* Case Details Panel */}
          <div className="lg:col-span-1">
            <CaseDetailsPanel caseData={sessionData.case} />
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={closeFeedbackModal}
        sessionId={sessionId}
        onSubmit={handleSubmitDiagnosis}
      />
    </div>
  );
}

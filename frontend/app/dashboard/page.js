'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Leaderboard from '../../components/Leaderboard';
import UserProfile from '../../components/UserProfile';
import { onAuthStateChange, getUserToken } from '../../lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingCase, setStartingCase] = useState(false);
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
    });

    return () => unsubscribe();
  }, [router]);

  const fetchSessions = async () => {
    try {
      const token = await getUserToken();
      if (!token) {
        router.push('/');
        return;
      }

      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Full URL:', `${API_BASE_URL}/api/sessions`);
      
      const response = await axios.get(`${API_BASE_URL}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Sessions response:', response.data.sessions);
      if (response.data.sessions && response.data.sessions.length > 0) {
        console.log('Sample session:', response.data.sessions[0]);
        console.log('Sample started_at:', response.data.sessions[0].started_at);
      }
      setSessions(response.data.sessions);
    } catch (err) {
      console.error('Fetch sessions error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        router.push('/');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(`Failed to load sessions: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const startNewCase = async () => {
    setStartingCase(true);
    setError('');

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
      setError('Failed to start new case');
      console.error('Start case error:', err);
    } finally {
      setStartingCase(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'active':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    let date;
    
    try {
      // Handle different timestamp formats
      if (timestamp.seconds) {
        // Firebase Timestamp format
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp._seconds) {
        // Alternative Firebase Timestamp format
        date = new Date(timestamp._seconds * 1000);
      } else if (typeof timestamp === 'string') {
        // ISO string format
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else if (typeof timestamp === 'number') {
        // Unix timestamp in milliseconds
        date = new Date(timestamp);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firebase Timestamp with toDate method
        date = timestamp.toDate();
      } else {
        console.log('Unknown timestamp format:', timestamp);
        return 'Unknown';
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date created from:', timestamp);
        return 'Unknown';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Timestamp:', timestamp);
      return 'Unknown';
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
      
      {/* Main Content with proper navbar spacing */}
      <div className="pt-6 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
                Medical Training Dashboard
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Practice with AI-powered medical case simulations and enhance your diagnostic skills
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
              <div className="card-elevated text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-medical rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-1">{sessions.length}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Cases</p>
              </div>
              
              <div className="card-elevated text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-medical rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-1">
                  {sessions.filter(s => s.status === 'completed').length}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Completed</p>
              </div>
              
              <div className="card-elevated text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-medical rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-1">
                  {sessions.filter(s => s.status === 'active').length}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">In Progress</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 card border-error/20 bg-gradient-to-r from-error/10 to-error/5">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-error mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-error font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Action Section */}
          <div className="mb-12 text-center">
            <button
              onClick={startNewCase}
              disabled={startingCase}
              className="btn-primary text-lg py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              {/* Loading overlay */}
              {startingCase && (
                <div className="absolute inset-0 bg-medical-dark/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              
              {/* Button content */}
              <span className="flex items-center space-x-3">
                {!startingCase && (
                  <svg className="h-6 w-6 transform group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                <span className="font-semibold">
                  {startingCase ? 'Starting New Case...' : 'Start New Medical Case'}
                </span>
              </span>
            </button>
            <p className="mt-3 text-sm text-muted-foreground">
              Practice your diagnostic skills with AI-powered patient simulations
            </p>
          </div>

          {/* Sessions History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <div className="card-elevated">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Your Medical Cases</h2>
                    <p className="text-muted-foreground">Track your progress and review past simulations</p>
                  </div>
                  <div className="flex items-center space-x-3 px-4 py-2 bg-elevated rounded-xl border border-border">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-foreground">Learning Progress</span>
                  </div>
                </div>
            
            {sessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mx-auto h-24 w-24 mb-6">
                  <div className="h-full w-full bg-elevated rounded-2xl flex items-center justify-center border border-border">
                    <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Ready to Start Learning?</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Begin your medical training journey with AI-powered patient simulations. Practice diagnosing real medical cases and get instant feedback.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:gap-4">
                {sessions.map((session, index) => (
                  <div key={session.session_id} className="relative">
                    {/* Modern Card Container */}
                    <div className="relative p-6 sm:p-8 rounded-2xl bg-surface border border-border">
                      
                      {/* Status Indicator Bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
                        session.status === 'completed' ? 'bg-medical' :
                        session.status === 'active' ? 'bg-medical' :
                        'bg-muted'
                      }`}></div>
                      
                      <div className="relative z-10">
                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-start space-x-4">
                            {/* Avatar with Medical Icon */}
                            <div className="relative">
                              <div className="h-14 w-14 bg-medical rounded-2xl flex items-center justify-center">
                                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              {/* Status Indicator */}
                              <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-surface ${
                                session.status === 'completed' ? 'bg-medical' :
                                session.status === 'active' ? 'bg-medical' :
                                'bg-muted'
                              }`}></div>
                            </div>
                            
                            {/* Patient Info */}
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-foreground mb-1">
                                {session.patient_name}
                              </h3>
                              <p className="text-muted-foreground leading-relaxed">{session.chief_complaint}</p>
                              
                              {/* Enhanced Metadata */}
                              <div className="flex flex-wrap items-center gap-3 mt-3">
                                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${
                                  session.status === 'completed' ? 'bg-medical/10 text-medical' :
                                  session.status === 'active' ? 'bg-medical/10 text-medical' :
                                  'bg-muted/20 text-muted-foreground'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    session.status === 'completed' ? 'bg-medical' :
                                    session.status === 'active' ? 'bg-medical' :
                                    'bg-muted'
                                  }`}></div>
                                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                </span>
                                
                                {session.score !== null && (
                                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-medical/10 text-medical rounded-full">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    <span className="font-bold text-sm">{session.score}/100</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Case Number Badge */}
                          <div className="hidden sm:flex items-center justify-center h-10 w-10 bg-muted/30 text-muted-foreground rounded-xl text-sm font-bold">
                            #{index + 1}
                          </div>
                        </div>
                        
                        {/* Dates Section */}
                        <div className="flex flex-wrap items-center gap-4 mb-6 pt-4 border-t border-border/20">
                          <div className="flex items-center space-x-2 text-sm">
                            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-muted-foreground">
                              <span className="font-medium">Started:</span> {formatDate(session.started_at)}
                            </span>
                          </div>
                          {session.completed_at && (
                            <div className="flex items-center space-x-2 text-sm">
                              <svg className="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-muted-foreground">
                                <span className="font-medium">Completed:</span> {formatDate(session.completed_at)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          {session.status === 'active' ? (
                            <button
                              onClick={() => router.push(`/simulation/${session.session_id}`)}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-medical text-white font-semibold rounded-xl"
                            >
                              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-10 4h12a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Continue Session
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/feedback/${session.session_id}`)}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-elevated text-foreground font-semibold rounded-xl border border-border"
                            >
                              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              View Results
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* User Profile Preview */}
              <UserProfile compact={true} />
              
              {/* Leaderboard Preview */}
              <Leaderboard showTitle={true} limit={5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

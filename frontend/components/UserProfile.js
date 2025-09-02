'use client';

import { useState, useEffect } from 'react';
import { getUserToken } from '../lib/firebase';

export default function UserProfile({ userId = null, compact = false }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getUserToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const endpoint = userId 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/${userId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown';
    
    try {
      let date;
      if (dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (dateValue._seconds) {
        date = new Date(dateValue._seconds * 1000);
      } else if (dateValue.toDate) {
        date = dateValue.toDate();
      } else {
        date = new Date(dateValue);
      }
      
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown';
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStreakEmoji = (streak) => {
    if (streak >= 10) return '🔥';
    if (streak >= 5) return '⭐';
    if (streak >= 3) return '✨';
    return '💯';
  };

  if (loading) {
    return (
      <div className={`bg-surface rounded-xl border border-border/50 p-6 ${compact ? 'max-w-md' : ''}`}>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-elevated p-4 rounded-lg">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-surface rounded-xl border border-border/50 p-6 ${compact ? 'max-w-md' : ''}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-muted-foreground mb-4">Failed to load profile</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-medical text-white rounded-lg hover:bg-medical-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className={`bg-surface rounded-xl border border-border/50 p-6 ${compact ? 'max-w-md' : ''}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👤</div>
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  const { user = {}, statistics = {}, achievements = [], recentActivity = [] } = profileData || {};

  if (compact) {
    return (
      <div className="bg-surface rounded-xl border border-border/50 p-6 max-w-md">
        {/* Compact Profile Header */}
        <div className="flex items-center space-x-4 mb-6">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.username || user.email || 'User'}
              className="w-16 h-16 rounded-full object-cover border-2 border-border/30"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br from-medical to-medical-dark flex items-center justify-center text-white text-xl font-bold ${user?.photoURL ? 'hidden' : 'flex'}`}
          >
            {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">{user?.username || user?.email?.split('@')[0] || 'User'}</h3>
            <p className="text-sm text-muted-foreground">
              Joined {formatDate(user?.created_at)}
            </p>
          </div>
        </div>

        {/* Compact Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-elevated p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-medical">{statistics?.totalSessions || 0}</div>
            <div className="text-sm text-muted-foreground">Cases</div>
          </div>
          <div className="bg-elevated p-4 rounded-lg text-center">
            <div className={`text-2xl font-bold ${getPerformanceColor(statistics?.averageScore || 0)}`}>
              {(statistics?.averageScore || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Average</div>
          </div>
          <div className="bg-elevated p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{statistics?.bestScore || 0}%</div>
            <div className="text-sm text-muted-foreground">Best Score</div>
          </div>
          <div className="bg-elevated p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center">
              {getStreakEmoji(statistics?.currentStreak || 0)} {statistics?.currentStreak || 0}
            </div>
            <div className="text-sm text-muted-foreground">Streak</div>
          </div>
        </div>

        {/* View Full Profile Link */}
        <div className="mt-6">
          <a
            href="/profile"
            className="block w-full text-center py-2 bg-medical text-white rounded-lg hover:bg-medical-dark"
          >
            View Full Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Full Profile Header */}
      <div className="bg-surface rounded-xl border border-border/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.username || user.email || 'User'}
              className="w-24 h-24 rounded-full object-cover border-4 border-border/30 mx-auto sm:mx-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-br from-medical to-medical-dark flex items-center justify-center text-white text-3xl font-bold mx-auto sm:mx-0 ${user?.photoURL ? 'hidden' : 'flex'}`}
          >
            {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-foreground mb-2">{user?.username || user?.email?.split('@')[0] || 'User'}</h1>
            <p className="text-muted-foreground mb-2">{user?.email}</p>
            <p className="text-sm text-muted-foreground">
              Medical Student • Joined {formatDate(user?.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface rounded-xl border border-border/50 p-6 text-center">
          <div className="text-4xl font-bold text-medical mb-2">{statistics?.totalSessions || 0}</div>
          <div className="text-sm text-muted-foreground mb-4">Total Cases</div>
          <div className="text-xs text-muted-foreground">
            Total Score: {statistics?.totalScore || 0}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border/50 p-6 text-center">
          <div className={`text-4xl font-bold mb-2 ${getPerformanceColor(statistics?.averageScore || 0)}`}>
            {(statistics?.averageScore || 0).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground mb-4">Average Score</div>
          <div className="text-xs text-muted-foreground">
            {(statistics?.improvementRate || 0) >= 0 ? '📈' : '📉'} 
            {Math.abs(statistics?.improvementRate || 0).toFixed(1)}% trend
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border/50 p-6 text-center">
          <div className="text-4xl font-bold text-yellow-600 mb-2">{statistics?.bestScore || 0}%</div>
          <div className="text-sm text-muted-foreground mb-4">Best Score</div>
          <div className="text-xs text-muted-foreground">
            Longest Streak: {statistics?.longestStreak || 0}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border/50 p-6 text-center">
          <div className="text-4xl font-bold text-orange-600 mb-2 flex items-center justify-center">
            {getStreakEmoji(statistics?.currentStreak || 0)} {statistics?.currentStreak || 0}
          </div>
          <div className="text-sm text-muted-foreground mb-4">Current Streak</div>
          <div className="text-xs text-muted-foreground">
            Success Rate: {(statistics?.totalSessions || 0) > 0 ? (((statistics?.currentStreak || 0) / (statistics?.totalSessions || 1)) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div className="bg-surface rounded-xl border border-border/50 p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            🏆 Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-elevated p-4 rounded-lg border border-border/30 hover:border-border transition-colors"
              >
                <h3 className="font-semibold text-foreground mb-1">{achievement.name}</h3>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Performance Chart */}
      {statistics && statistics.recentPerformance && statistics.recentPerformance.length > 0 && (
        <div className="bg-surface rounded-xl border border-border/50 p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            📈 Recent Performance
          </h2>
          <div className="space-y-3">
            {statistics.recentPerformance.slice(-5).map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-elevated rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getPerformanceColor(session.score).replace('text-', 'bg-')}`}></div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(session.date)}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {session.case_type || 'General'}
                  </span>
                </div>
                <div className={`font-bold ${getPerformanceColor(session.score)}`}>
                  {session.score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="bg-surface rounded-xl border border-border/50 p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            📋 Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-elevated rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-foreground">{activity.patient_name}</h3>
                    <span className="text-xs bg-medical/20 text-medical px-2 py-1 rounded-full">
                      {activity.case_type || 'General'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Diagnosis: {activity.diagnosis}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(activity.date)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getPerformanceColor(activity.score)}`}>
                    {activity.score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {statistics && statistics.totalSessions === 0 && (
        <div className="bg-surface rounded-xl border border-border/50 p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Start Learning?</h3>
            <p className="text-muted-foreground mb-6">
              Complete your first medical case to begin tracking your progress and earning achievements!
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-medical text-white rounded-lg hover:bg-medical-dark font-medium"
            >
              Start First Case
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { getUserToken } from '../lib/firebase';

export default function Leaderboard({ showTitle = true, limit = 10 }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getUserToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leaderboard`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data = await response.json();
      setLeaderboardData(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getTrophyIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border/50 p-6">
        {showTitle && (
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            🏆 Leaderboard
          </h2>
        )}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-elevated rounded-lg">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
              <div className="w-16 h-6 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border/50 p-6">
        {showTitle && (
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            🏆 Leaderboard
          </h2>
        )}
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-muted-foreground mb-4">Failed to load leaderboard</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-medical text-white rounded-lg hover:bg-medical-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayData = limit ? leaderboardData.slice(0, limit) : leaderboardData;

  return (
    <div className="bg-surface rounded-xl border border-border/50 p-6">
      {showTitle && (
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
          🏆 Leaderboard
        </h2>
      )}

      {displayData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Rankings Yet</h3>
          <p className="text-muted-foreground">
            Complete some medical cases to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayData.map((user, index) => (
            <div
              key={user.userId || user.email || `leaderboard-user-${index}`}
              className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                index < 3
                  ? 'bg-gradient-to-r from-medical/10 to-medical-dark/10'
                  : 'bg-elevated'
              }`}
            >
              {/* Rank and Trophy */}
              <div className="flex items-center justify-center w-10 h-10">
                <span className="text-2xl">{getTrophyIcon(user.rank)}</span>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Profile Picture or Initial */}
                <div className="relative w-10 h-10">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name || user.username || 'User'}
                      className="w-full h-full rounded-full object-cover border-2 border-border/30"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.querySelector('.fallback-avatar').style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`fallback-avatar absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-medical to-medical-dark flex items-center justify-center text-white text-sm font-semibold ${
                      user.photoURL ? 'hidden' : 'flex'
                    }`}
                  >
                    {(user.name || user.username || 'Learner').charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {user.name || user.username || 'Learner'}
                  </h3>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <span>{user.totalSessions} cases</span>
                    {user.currentStreak > 0 && (
                      <span className="flex items-center">
                        🔥 {user.currentStreak} streak
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score Badge */}
              <div className="flex flex-col items-end space-y-1">
                <div
                  className={`px-3 py-1.5 rounded-lg text-white text-sm font-bold ${getScoreBadgeColor(
                    user.averageScore
                  )}`}
                >
                  {user.averageScore.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Best: {user.bestScore}%
                </div>
              </div>

              {/* Rank Number */}
              <div className="text-2xl font-bold text-muted-foreground/50 w-8 text-center">
                #{user.rank}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show More Button for Limited View */}
      {limit && leaderboardData.length > limit && (
        <div className="mt-6 text-center">
          <a
            href="/leaderboard"
            className="inline-flex items-center px-4 py-2 bg-elevated text-foreground rounded-lg hover:bg-elevated/80 font-medium"
          >
            View Full Leaderboard
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

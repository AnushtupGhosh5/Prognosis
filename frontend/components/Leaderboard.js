'use client';

import { useEffect, useState } from 'react';
import { getLeaderboard } from '../lib/leaderboard';

export default function Leaderboard({ showTitle = true, limit = 10 }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLeaderboard(limit || 50);
        if (!mounted) return;
        setLeaderboardData(data || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load leaderboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [limit]);

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border/50 p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-elevated rounded-lg">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/6"></div>
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
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const data = await getLeaderboard(limit || 50);
                setLeaderboardData(data || []);
                setError(null);
              } catch (e) {
                setError(e?.message || 'Failed to load leaderboard');
              } finally {
                setLoading(false);
              }
            }}
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
        <h2 className="text-2xl font-bold text-foreground mb-6">Leaderboard</h2>
      )}

      {displayData.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-foreground mb-2">No Rankings Yet</h3>
          <p className="text-muted-foreground">
            Complete some cases to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/50">
          {displayData.map((user, index) => (
            <li key={user.id || index} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover border border-border/40"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br from-medical to-medical-dark text-white font-semibold items-center justify-center ${
                    user.photoURL ? 'hidden' : 'flex'
                  }`}
                >
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {user.name || 'Unnamed User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Rank #{index + 1}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block min-w-[64px] text-right font-bold">
                  {typeof user.score === 'number' ? user.score.toFixed(1) : user.score}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


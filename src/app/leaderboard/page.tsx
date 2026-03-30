'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  projectTitle: string;
  memberCount: number;
  members: { id: string; name: string }[];
  averageScore: number;
  totalProgress: number;
  totalBatches: number;
  aiDependencyRate: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) return;
      const data = await res.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-accent)';
    if (score >= 40) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getRankMedal = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: 'var(--space-4) var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Link 
              href="/" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-3)',
                textDecoration: 'none',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                background: 'var(--color-accent)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}>
                🏆
              </div>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: 'var(--color-text-primary)',
              }}>
                Leaderboard
              </span>
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Link 
              href="/monitor" 
              className="btn btn-ghost"
              style={{ textDecoration: 'none' }}
            >
              Monitor
            </Link>
            <Link 
              href="/admin" 
              className="btn btn-ghost"
              style={{ textDecoration: 'none' }}
            >
              Admin
            </Link>
            <Link 
              href="/" 
              className="btn btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--space-6)' }}>
        {/* Title */}
        <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-2)',
          }}>
            Team Leaderboard
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--color-text-secondary)',
          }}>
            Teams ranked by average performance score
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⏳</div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="card-elevated" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📊</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
              No Teams Yet
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Teams will appear here once they start submitting work
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {leaderboard.map((entry) => (
              <div 
                key={entry.teamId}
                className="card-elevated"
                style={{
                  padding: 'var(--space-5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-5)',
                  border: entry.rank <= 3 ? `2px solid ${getScoreColor(entry.averageScore)}` : undefined,
                  background: entry.rank === 1 
                    ? 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-success-subtle) 100%)'
                    : 'var(--color-surface)',
                }}
              >
                {/* Rank */}
                <div style={{
                  minWidth: '60px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: entry.rank <= 3 ? '32px' : '24px',
                    fontWeight: 600,
                    color: entry.rank <= 3 ? getScoreColor(entry.averageScore) : 'var(--color-text-tertiary)',
                  }}>
                    {getRankMedal(entry.rank)}
                  </div>
                </div>

                {/* Team Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-1)',
                  }}>
                    {entry.teamName}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-2)',
                  }}>
                    {entry.projectTitle}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {entry.members.map(m => (
                      <div 
                        key={m.id}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--color-surface-elevated)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {m.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 'var(--space-4)',
                  minWidth: '500px',
                }}>
                  {/* Average Score */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: getScoreColor(entry.averageScore),
                      marginBottom: 'var(--space-1)',
                    }}>
                      {entry.averageScore.toFixed(1)}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Avg Score
                    </div>
                  </div>

                  {/* Total Progress */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: 'var(--color-accent)',
                      marginBottom: 'var(--space-1)',
                    }}>
                      {entry.totalProgress.toFixed(1)}%
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Progress
                    </div>
                  </div>

                  {/* Batches */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)',
                    }}>
                      {entry.totalBatches}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Batches
                    </div>
                  </div>

                  {/* AI Dependency */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: entry.aiDependencyRate >= 70 ? 'var(--color-error)' : 'var(--color-success)',
                      marginBottom: 'var(--space-1)',
                    }}>
                      {entry.aiDependencyRate.toFixed(0)}%
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      AI Dep.
                    </div>
                  </div>
                </div>

                {/* View Button */}
                <Link
                  href={`/monitor?team=${entry.teamId}`}
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', minWidth: '100px' }}
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TeamProgress {
  id: number;
  teamId: string;
  userId: string;
  startTime: string;
  endTime: string;
  gptSummary?: string | null;
  gptScore: number | null;
  llamaSummary?: string | null;
  llamaScore: number | null;
  meanScore: number | null;
  progressPercentage?: number | null;
  aiDependencyDetected: boolean;
  createdAt: string;
}

interface ImageAnalysis {
  id: number;
  userId: string;
  teamId: string;
  timestamp: string;
  countCycle: number;
  description: string;
  aiDependencyFlag: boolean;
  confidence: number;
  createdAt: string;
  member: { name: string };
}

interface Team {
  id: string;
  name: string;
  projectTitle: string;
  projectDescription: string;
  liveSummary?: string | null;
  members: { id: string; name: string }[];
}

export default function MonitorDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [progress, setProgress] = useState<Record<string, TeamProgress[]>>({});
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(() => {
      fetchProgress();
      fetchTeams(); // Also refresh teams to get updated live summary
      if (selectedTeam) fetchAnalyses();
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setTeams(data);
        if (data.length > 0 && !selectedTeam) setSelectedTeam(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/monitor/progress');
      if (!res.ok) return;
      const data = await res.json();
      setProgress(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchAnalyses = async () => {
    if (!selectedTeam) return;
    try {
      const res = await fetch(`/api/monitor/analyses?teamId=${selectedTeam}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setAnalyses(data);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    }
  };

  const regenerateLiveSummary = async () => {
    if (!selectedTeam || regenerating) return;
    
    setRegenerating(true);
    try {
      const res = await fetch('/api/admin/regenerate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeam }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error}`);
        return;
      }

      const result = await res.json();
      alert(`Successfully regenerated live summary from ${result.batchesProcessed} batches!`);
      
      // Refresh teams to get updated live summary
      await fetchTeams();
    } catch (error) {
      console.error('Error regenerating summary:', error);
      alert('Failed to regenerate live summary');
    } finally {
      setRegenerating(false);
    }
  };

  const teamProgress = selectedTeam ? progress[selectedTeam] || [] : [];
  const team = teams.find(t => t.id === selectedTeam);

  // Calculate metrics
  const totalBatches = teamProgress.length;
  const aiFlaggedBatches = teamProgress.filter(p => p.aiDependencyDetected).length;
  const aiDependencyPercentage = totalBatches > 0 ? (aiFlaggedBatches / totalBatches) * 100 : 0;
  const isAiDrivenProject = aiDependencyPercentage >= 70;
  const totalTeamProgress = teamProgress.reduce((sum, p) => {
    const progress = p.progressPercentage != null ? Number(p.progressPercentage) : 0;
    return sum + progress;
  }, 0);
  const cappedTeamProgress = Math.min(totalTeamProgress, 100);
  const avgMeanScore = totalBatches > 0 
    ? teamProgress.reduce((sum, p) => sum + (p.meanScore != null ? Number(p.meanScore) : 0), 0) / totalBatches 
    : 0;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'var(--color-score-excellent)';
    if (score >= 60) return 'var(--color-score-good)';
    if (score >= 40) return 'var(--color-score-moderate)';
    if (score >= 20) return 'var(--color-score-poor)';
    return 'var(--color-score-critical)';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', class: 'badge-success' };
    if (score >= 60) return { label: 'Good', class: 'badge-success' };
    if (score >= 40) return { label: 'Moderate', class: 'badge-warning' };
    if (score >= 20) return { label: 'Poor', class: 'badge-warning' };
    return { label: 'Critical', class: 'badge-error' };
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
                ◈
              </div>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: 'var(--color-text-primary)',
              }}>
                Monitor
              </span>
            </Link>
            <span style={{ color: 'var(--color-border-strong)' }}>/</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Live Dashboard
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                background: 'var(--color-success)',
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
              }} />
              Live
            </div>
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
        {/* Team Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}>
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="input"
              style={{ 
                cursor: 'pointer',
                paddingRight: 'var(--space-10)',
              }}
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <span style={{
              position: 'absolute',
              right: 'var(--space-4)',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--color-text-tertiary)',
            }}>
              ▼
            </span>
          </div>
          <button
            onClick={() => {
              fetchProgress();
              if (selectedTeam) fetchAnalyses();
              setLastUpdated(new Date());
            }}
            className="btn btn-secondary"
          >
            ↻ Refresh
          </button>
          <span style={{
            marginLeft: 'auto',
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
          }}>
            {mounted ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </span>
        </div>

        {team && (
          <>
            {/* Team Info Card */}
            <div className="card-elevated" style={{ 
              padding: 'var(--space-6)', 
              marginBottom: 'var(--space-6)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div>
                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-2)',
                  }}>
                    {team.name}
                  </h1>
                  <p style={{
                    fontSize: '15px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    {team.projectTitle}
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--color-text-tertiary)',
                    maxWidth: '600px',
                    lineHeight: 1.5,
                  }}>
                    {team.projectDescription}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {team.members.map(m => (
                    <div 
                      key={m.id}
                      style={{
                        width: '36px',
                        height: '36px',
                        background: 'var(--color-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--color-accent)',
                        border: '1px solid var(--color-border)',
                      }}
                      title={m.name}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Consolidated Summary */}
            {team.liveSummary ? (
              <div className="card-elevated" style={{ 
                padding: 'var(--space-6)', 
                marginBottom: 'var(--space-6)',
                background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%)',
                border: '2px solid var(--color-accent)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-5)',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--color-accent)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    ⚡
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)',
                    }}>
                      Live Consolidated Summary
                    </h2>
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--color-text-tertiary)',
                    }}>
                      Comprehensive analysis of team progress, productivity, and insights
                    </p>
                  </div>
                </div>
                <div 
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.8,
                    color: 'var(--color-text-secondary)',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: team.liveSummary
                      .split('\n')
                      .map(line => {
                        // Headers
                        if (line.startsWith('## ')) {
                          return `<h3 style="font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-top: 24px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid var(--color-border);">${line.replace('## ', '')}</h3>`;
                        }
                        // Bold text
                        if (line.includes('**')) {
                          return `<p style="margin: 8px 0; font-weight: 600; color: var(--color-text-primary);">${line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>`;
                        }
                        // Bullet points with checkmark
                        if (line.startsWith('✓ ')) {
                          return `<div style="display: flex; gap: 8px; margin: 6px 0; padding: 8px; background: var(--color-success-subtle); border-left: 3px solid var(--color-success); border-radius: 4px;"><span style="color: var(--color-success); font-weight: 600;">✓</span><span>${line.replace('✓ ', '')}</span></div>`;
                        }
                        // Warning points
                        if (line.startsWith('⚠ ')) {
                          return `<div style="display: flex; gap: 8px; margin: 6px 0; padding: 8px; background: var(--color-warning-subtle); border-left: 3px solid var(--color-warning); border-radius: 4px;"><span style="color: var(--color-warning); font-weight: 600;">⚠</span><span>${line.replace('⚠ ', '')}</span></div>`;
                        }
                        // Regular bullet points
                        if (line.startsWith('• ')) {
                          return `<div style="display: flex; gap: 8px; margin: 6px 0; padding-left: 12px;"><span style="color: var(--color-accent); font-weight: 600;">•</span><span>${line.replace('• ', '')}</span></div>`;
                        }
                        // Recommendations
                        if (line.startsWith('→ ')) {
                          return `<div style="display: flex; gap: 8px; margin: 6px 0; padding: 8px; background: var(--color-surface-elevated); border-left: 3px solid var(--color-accent); border-radius: 4px;"><span style="color: var(--color-accent); font-weight: 600;">→</span><span>${line.replace('→ ', '')}</span></div>`;
                        }
                        // Regular paragraphs
                        if (line.trim()) {
                          return `<p style="margin: 8px 0; line-height: 1.6;">${line}</p>`;
                        }
                        return '';
                      })
                      .join('')
                  }}
                />
              </div>
            ) : totalBatches > 0 ? (
              <div className="card-elevated" style={{ 
                padding: 'var(--space-6)', 
                marginBottom: 'var(--space-6)',
                border: '2px dashed var(--color-border)',
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'var(--color-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    📝
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}>
                      No Live Summary Yet
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--space-4)',
                      maxWidth: '400px',
                    }}>
                      Generate a consolidated summary from {totalBatches} existing batch summaries
                    </p>
                  </div>
                  <button
                    onClick={regenerateLiveSummary}
                    disabled={regenerating}
                    className="btn btn-primary"
                    style={{
                      minWidth: '200px',
                    }}
                  >
                    {regenerating ? 'Generating...' : '⚡ Generate Live Summary'}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'var(--space-5)',
              marginBottom: 'var(--space-6)',
            }}>
              {/* Total Progress */}
              <div className="stat-card">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <span 
                    className="stat-value" 
                    style={{ color: getScoreColor(cappedTeamProgress) }}
                  >
                    {cappedTeamProgress.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '18px', color: 'var(--color-text-tertiary)' }}>%</span>
                </div>
                <div className="stat-label">Total Progress</div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--color-text-muted)',
                  marginTop: 'var(--space-2)',
                }}>
                  From {totalBatches} batch summaries
                </div>
              </div>

              {/* Average Score */}
              <div className="stat-card">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <span 
                    className="stat-value" 
                    style={{ color: getScoreColor(avgMeanScore) }}
                  >
                    {avgMeanScore.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '18px', color: 'var(--color-text-tertiary)' }}>/100</span>
                </div>
                <div className="stat-label">Average Score</div>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <span className={`badge ${getScoreBadge(avgMeanScore).class}`}>
                    {getScoreBadge(avgMeanScore).label}
                  </span>
                </div>
              </div>

              {/* AI Dependency */}
              <div className="stat-card" style={{
                borderColor: isAiDrivenProject ? 'var(--color-error-border)' : 'var(--color-border)',
                background: isAiDrivenProject ? 'var(--color-error-subtle)' : 'var(--color-surface)',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <span 
                    className="stat-value" 
                    style={{ color: isAiDrivenProject ? 'var(--color-error)' : 'var(--color-success)' }}
                  >
                    {aiDependencyPercentage.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '18px', color: 'var(--color-text-tertiary)' }}>%</span>
                </div>
                <div className="stat-label">AI Dependency</div>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <span className={`badge ${isAiDrivenProject ? 'badge-error' : 'badge-success'}`}>
                    {isAiDrivenProject ? 'High Risk' : 'Acceptable'}
                  </span>
                </div>
              </div>

              {/* Batch Count */}
              <div className="stat-card">
                <span className="stat-value" style={{ color: 'var(--color-accent)' }}>
                  {totalBatches}
                </span>
                <div className="stat-label">Batches Analyzed</div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--color-text-muted)',
                  marginTop: 'var(--space-2)',
                }}>
                  ~{totalBatches * 3} minutes tracked
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-6)',
            }}>
              {/* Live Analysis */}
              <div>
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Live Screenshot Analysis</h2>
                    <p className="section-subtitle">
                      Real-time activity from {analyses.length} screenshots
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  paddingRight: 'var(--space-2)',
                }}>
                  {analyses.length === 0 ? (
                    <div className="card-elevated" style={{ padding: 'var(--space-12)' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">◉</div>
                        <div className="empty-state-title">No screenshots yet</div>
                        <div className="empty-state-desc">
                          Waiting for Electron app to send screenshots
                        </div>
                      </div>
                    </div>
                  ) : (
                    analyses.map(a => (
                      <div 
                        key={a.id}
                        className="card-elevated"
                        style={{ 
                          padding: 'var(--space-4)',
                          borderLeft: a.aiDependencyFlag 
                            ? '3px solid var(--color-warning)' 
                            : '3px solid transparent',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 'var(--space-3)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              background: 'var(--color-surface-elevated)',
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--color-accent)',
                            }}>
                              {a.member.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ 
                              fontWeight: 500, 
                              color: 'var(--color-text-primary)',
                              fontSize: '14px',
                            }}>
                              {a.member.name}
                            </span>
                          </div>
                          <span style={{ 
                            fontSize: '12px', 
                            color: 'var(--color-text-tertiary)',
                            fontFamily: 'monospace',
                          }}>
                            {mounted ? new Date(a.timestamp).toLocaleTimeString() : '--:--:--'}
                          </span>
                        </div>
                        
                        <p style={{
                          fontSize: '14px',
                          lineHeight: 1.5,
                          color: 'var(--color-text-secondary)',
                          marginBottom: 'var(--space-3)',
                        }}>
                          {a.description}
                        </p>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                        }}>
                          <span style={{
                            fontSize: '12px',
                            color: 'var(--color-text-tertiary)',
                          }}>
                            Confidence: {Math.round(a.confidence * 100)}%
                          </span>
                          {a.aiDependencyFlag && (
                            <span className="badge badge-warning">
                              AI Flag
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Batch Summaries */}
              <div>
                <div className="section-header">
                  <div>
                    <h2 className="section-title">3-Minute Batch Summaries</h2>
                    <p className="section-subtitle">
                      Dual-model analysis (GPT + Llama)
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  paddingRight: 'var(--space-2)',
                }}>
                  {teamProgress.length === 0 ? (
                    <div className="card-elevated" style={{ padding: 'var(--space-12)' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">◈</div>
                        <div className="empty-state-title">No batches yet</div>
                        <div className="empty-state-desc">
                          Need 6 screenshots (3 minutes) to generate summary
                        </div>
                      </div>
                    </div>
                  ) : (
                    teamProgress.map(p => {
                      const badge = getScoreBadge(p.meanScore || 0);
                      return (
                        <div 
                          key={p.id}
                          className="card-elevated"
                          style={{ 
                            padding: 'var(--space-4)',
                            borderLeft: p.aiDependencyDetected 
                              ? '3px solid var(--color-error)' 
                              : '3px solid transparent',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 'var(--space-4)',
                          }}>
                            <div>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--color-text-primary)',
                                marginBottom: 'var(--space-1)',
                              }}>
                                {mounted ? `${new Date(p.startTime).toLocaleTimeString()} - ${new Date(p.endTime).toLocaleTimeString()}` : 'Loading...'}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: 'var(--color-text-tertiary)',
                              }}>
                                Progress: {p.progressPercentage != null ? p.progressPercentage.toFixed(2) : '0.00'}%
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                fontSize: '28px',
                                fontWeight: 600,
                                color: getScoreColor(p.meanScore || 0),
                                lineHeight: 1,
                              }}>
                                {(p.meanScore || 0).toFixed(1)}
                              </div>
                              <span className={`badge ${badge.class}`} style={{ marginTop: 'var(--space-2)' }}>
                                {badge.label}
                              </span>
                            </div>
                          </div>

                          {/* Model Summaries */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-3)',
                            marginBottom: 'var(--space-3)',
                          }}>
                            {/* GPT Summary */}
                            {p.gptSummary && (
                              <div style={{
                                padding: 'var(--space-3)',
                                background: 'var(--color-surface-elevated)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: 'var(--space-2)',
                                }}>
                                  <div style={{
                                    fontSize: '11px',
                                    color: 'var(--color-text-tertiary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 600,
                                  }}>
                                    GPT-4 Analysis
                                  </div>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: getScoreColor(p.gptScore || 0),
                                  }}>
                                    {(p.gptScore || 0).toFixed(1)}
                                  </div>
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  lineHeight: 1.5,
                                  color: 'var(--color-text-secondary)',
                                }}>
                                  {p.gptSummary}
                                </div>
                              </div>
                            )}

                            {/* Llama Summary */}
                            {p.llamaSummary && (
                              <div style={{
                                padding: 'var(--space-3)',
                                background: 'var(--color-surface-elevated)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: 'var(--space-2)',
                                }}>
                                  <div style={{
                                    fontSize: '11px',
                                    color: 'var(--color-text-tertiary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 600,
                                  }}>
                                    Llama-3 Analysis
                                  </div>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: getScoreColor(p.llamaScore || 0),
                                  }}>
                                    {(p.llamaScore || 0).toFixed(1)}
                                  </div>
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  lineHeight: 1.5,
                                  color: 'var(--color-text-secondary)',
                                }}>
                                  {p.llamaSummary}
                                </div>
                              </div>
                            )}
                          </div>

                          {p.aiDependencyDetected && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-2)',
                              padding: 'var(--space-3)',
                              background: 'var(--color-error-subtle)',
                              border: '1px solid var(--color-error-border)',
                              borderRadius: 'var(--radius-md)',
                            }}>
                              <span style={{ color: 'var(--color-error)', fontSize: '14px' }}>⚠</span>
                              <span style={{
                                fontSize: '13px',
                                color: 'var(--color-error)',
                                fontWeight: 500,
                              }}>
                                AI Dependency Detected
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

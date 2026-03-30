'use client';

import { useState, useEffect } from 'react';

interface TeamProgress {
  id: number;
  teamId: string;
  userId: string;
  startTime: string;
  endTime: string;
  gptScore: number;
  llamaScore: number;
  meanScore: number;
  progressPercentage?: number;
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
  members: { id: string; name: string }[];
}

export default function MonitorDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [progress, setProgress] = useState<Record<string, TeamProgress[]>>({});
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(() => {
      fetchProgress();
      if (selectedTeam) fetchAnalyses();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams');
      if (!res.ok) {
        console.error('Failed to fetch teams:', res.status);
        return;
      }
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
      console.log('Fetched progress data:', data);
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

  const teamProgress = selectedTeam ? progress[selectedTeam] || [] : [];
  const team = teams.find(t => t.id === selectedTeam);

  // Calculate overall AI dependency percentage
  const totalBatches = teamProgress.length;
  const aiFlaggedBatches = teamProgress.filter(p => p.aiDependencyDetected).length;
  const aiDependencyPercentage = totalBatches > 0 ? (aiFlaggedBatches / totalBatches) * 100 : 0;
  const isAiDrivenProject = aiDependencyPercentage >= 70;

  // Calculate total team progress percentage (sum of all batch progress)
  const totalTeamProgress = teamProgress.reduce((sum, p) => sum + (p.progressPercentage || 0), 0);
  const cappedTeamProgress = Math.min(totalTeamProgress, 100); // Cap at 100%

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Hackathon Monitor - Live Dashboard</h1>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label style={{ fontWeight: 'bold' }}>Select Team:</label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        >
          {Array.isArray(teams) && teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button
          onClick={() => {
            fetchProgress();
            if (selectedTeam) fetchAnalyses();
          }}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🔄 Refresh
        </button>
      </div>

      {team && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h2>{team.name}</h2>
          <p><strong>Project:</strong> {team.projectTitle}</p>
          <p><strong>Members:</strong> {Array.isArray(team.members) ? team.members.map(m => m.name).join(', ') : 'None'}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            {/* Total Team Progress */}
            <div style={{ padding: '1rem', background: 'white', borderRadius: '6px', border: '2px solid #007bff' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Team Progress</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                {cappedTeamProgress.toFixed(2)}%
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Based on {totalBatches} batch{totalBatches !== 1 ? 'es' : ''} from all members
              </div>
            </div>

            {/* AI Dependency Analysis */}
            <div style={{ padding: '1rem', background: isAiDrivenProject ? '#fff3cd' : '#d4edda', borderRadius: '6px', border: `2px solid ${isAiDrivenProject ? '#ffc107' : '#28a745'}` }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>AI Dependency Analysis</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isAiDrivenProject ? '#856404' : '#155724' }}>
                {aiDependencyPercentage.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {aiFlaggedBatches} out of {totalBatches} batches flagged
              </div>
              {isAiDrivenProject && (
                <div style={{ marginTop: '0.5rem', color: '#856404', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  ⚠️ WARNING: Heavily AI-driven (≥70%)
                </div>
              )}
              {!isAiDrivenProject && aiDependencyPercentage > 0 && (
                <div style={{ marginTop: '0.5rem', color: '#155724', fontSize: '0.9rem' }}>
                  ✅ Acceptable AI usage
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '3rem' }}>
        <h2>Live Screenshot Analysis</h2>
        {analyses.length === 0 ? (
          <p style={{ color: '#666', marginTop: '1rem' }}>No screenshots analyzed yet...</p>
        ) : (
          <div style={{ marginTop: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
            {analyses.map(a => (
              <div
                key={a.id}
                style={{
                  border: '1px solid #ddd',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  borderRadius: '6px',
                  background: a.aiDependencyFlag ? '#fff3cd' : '#f8f9fa',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{a.member.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>{a.description}</p>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  Confidence: {(a.confidence * 100).toFixed(0)}%
                  {a.aiDependencyFlag && (
                    <span style={{ marginLeft: '1rem', color: '#856404', fontWeight: 'bold' }}>
                      ⚠️ AI Dependency
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2>3-Minute Batch Summaries ({teamProgress.length})</h2>
        {teamProgress.length === 0 ? (
          <p style={{ color: '#666', marginTop: '1rem' }}>No batch summaries yet (need 6 screenshots = 3 minutes)...</p>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            {teamProgress.map(p => (
              <div
                key={p.id}
                style={{
                  border: '1px solid #ddd',
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderRadius: '8px',
                  background: p.aiDependencyDetected ? '#fff3cd' : 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{new Date(p.startTime).toLocaleTimeString()}</strong>
                    {' - '}
                    {new Date(p.endTime).toLocaleTimeString()}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1rem', color: '#666' }}>
                      Progress: {p.progressPercentage?.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getScoreColor(p.meanScore) }}>
                      {p.meanScore.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  GPT: {p.gptScore.toFixed(1)} | Llama: {p.llamaScore.toFixed(1)}
                </div>
                {p.aiDependencyDetected && (
                  <div style={{ marginTop: '0.5rem', color: '#856404', fontWeight: 'bold' }}>
                    ⚠️ AI Dependency Detected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#28a745';
  if (score >= 60) return '#5cb85c';
  if (score >= 40) return '#ffc107';
  if (score >= 20) return '#fd7e14';
  return '#dc3545';
}

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
  aiDependencyDetected: boolean;
  createdAt: string;
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
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchProgress, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTeams = async () => {
    const res = await fetch('/api/admin/teams');
    const data = await res.json();
    setTeams(data);
    if (data.length > 0 && !selectedTeam) setSelectedTeam(data[0].id);
  };

  const fetchProgress = async () => {
    const res = await fetch('/api/monitor/progress');
    const data = await res.json();
    setProgress(data);
  };

  const teamProgress = selectedTeam ? progress[selectedTeam] || [] : [];
  const team = teams.find(t => t.id === selectedTeam);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Hackathon Monitor - Live Dashboard</h1>

      <div style={{ marginTop: '2rem' }}>
        <label style={{ marginRight: '1rem', fontWeight: 'bold' }}>Select Team:</label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        >
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {team && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h2>{team.name}</h2>
          <p><strong>Project:</strong> {team.projectTitle}</p>
          <p><strong>Members:</strong> {team.members.map(m => m.name).join(', ')}</p>
        </div>
      )}

      <div style={{ marginTop: '3rem' }}>
        <h2>Progress Timeline</h2>
        {teamProgress.length === 0 ? (
          <p style={{ color: '#666', marginTop: '1rem' }}>No activity recorded yet...</p>
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
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getScoreColor(p.meanScore) }}>
                    {p.meanScore.toFixed(1)}
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

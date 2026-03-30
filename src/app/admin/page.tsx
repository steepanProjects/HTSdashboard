'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  projectTitle: string;
  projectDescription: string;
  createdAt: string;
  _count: { members: number };
  members: { id: string; name: string }[];
}

interface Member {
  id: string;
  name: string;
  email: string;
  teamId: string;
  team: { name: string };
  createdAt: string;
}

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [teamName, setTeamName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'teams' | 'members'>('teams');

  useEffect(() => {
    fetchTeams();
    fetchMembers();
  }, []);

  const fetchTeams = async () => {
    const res = await fetch('/api/admin/teams');
    const data = await res.json();
    setTeams(data);
  };

  const fetchMembers = async () => {
    const res = await fetch('/api/admin/members');
    const data = await res.json();
    setMembers(data);
  };

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          projectTitle,
          projectDescription,
        }),
      });
      if (res.ok) {
        setTeamName('');
        setProjectTitle('');
        setProjectDescription('');
        fetchTeams();
      }
    } finally {
      setLoading(false);
    }
  };

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: memberName,
          email: memberEmail,
          teamId: selectedTeamId,
        }),
      });
      if (res.ok) {
        setMemberName('');
        setMemberEmail('');
        setSelectedTeamId('');
        fetchMembers();
        fetchTeams();
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Delete this team and all its members?')) return;
    await fetch(`/api/admin/teams?id=${id}`, { method: 'DELETE' });
    fetchTeams();
    fetchMembers();
  };

  const deleteMember = async (id: string) => {
    if (!confirm('Delete this member?')) return;
    await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' });
    fetchMembers();
    fetchTeams();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <div style={{ 
          maxWidth: '1200px', 
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
                Admin
              </span>
            </Link>
            <span style={{ color: 'var(--color-border-strong)' }}>/</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Dashboard
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link 
              href="/monitor" 
              className="btn btn-ghost"
              style={{ textDecoration: 'none' }}
            >
              Monitor
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

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-8)',
        }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-accent)' }}>
              {teams.length}
            </div>
            <div className="stat-label">Total Teams</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
              {members.length}
            </div>
            <div className="stat-label">Total Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
              {teams.length > 0 ? (members.length / teams.length).toFixed(1) : '0'}
            </div>
            <div className="stat-label">Avg Members/Team</div>
          </div>
        </div>

        {/* Create Forms */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}>
          {/* Create Team */}
          <div className="card-elevated" style={{ padding: 'var(--space-6)' }}>
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-1)',
              }}>
                Create Team
              </h2>
              <p style={{
                fontSize: '13px',
                color: 'var(--color-text-tertiary)',
              }}>
                Add a new hackathon team with project details
              </p>
            </div>
            <form onSubmit={createTeam}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g., Code Warriors"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g., AI Task Manager"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea
                  placeholder="Describe the project goals and features..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  required
                  rows={3}
                  className="input"
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          </div>

          {/* Create Member */}
          <div className="card-elevated" style={{ padding: 'var(--space-6)' }}>
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-1)',
              }}>
                Create Member
              </h2>
              <p style={{
                fontSize: '13px',
                color: 'var(--color-text-tertiary)',
              }}>
                Add a developer to an existing team
              </p>
            </div>
            <form onSubmit={createMember}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Select Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  required
                  className="input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Choose a team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading || teams.length === 0}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Creating...' : 'Create Member'}
              </button>
            </form>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-6)' }}>
          <button
            onClick={() => setActiveTab('teams')}
            className="btn"
            style={{
              background: activeTab === 'teams' ? 'var(--color-surface-elevated)' : 'transparent',
              color: activeTab === 'teams' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Teams ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className="btn"
            style={{
              background: activeTab === 'members' ? 'var(--color-surface-elevated)' : 'transparent',
              color: activeTab === 'members' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Members ({members.length})
          </button>
        </div>

        {/* Teams Table */}
        {activeTab === 'teams' && (
          <div className="table-container">
            {teams.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">◈</div>
                <div className="empty-state-title">No teams yet</div>
                <div className="empty-state-desc">Create your first team using the form above</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Project</th>
                    <th>Members</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {team.name}
                          </div>
                          <div 
                            style={{ 
                              fontSize: '12px', 
                              color: 'var(--color-text-muted)',
                              fontFamily: 'monospace',
                              marginTop: 'var(--space-1)',
                              cursor: 'pointer',
                            }}
                            onClick={() => copyToClipboard(team.id)}
                            title="Click to copy ID"
                          >
                            {team.id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '300px' }}>
                          <div style={{ fontWeight: 500 }}>{team.projectTitle}</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--color-text-tertiary)',
                            marginTop: 'var(--space-1)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {team.projectDescription}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-accent">
                          {team._count.members} member{team._count.members !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>{new Date(team.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => deleteTeam(team.id)}
                          className="btn btn-danger"
                          style={{ padding: 'var(--space-2) var(--space-3)', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Members Table */}
        {activeTab === 'members' && (
          <div className="table-container">
            {members.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">●</div>
                <div className="empty-state-title">No members yet</div>
                <div className="empty-state-desc">Add members to teams using the form above</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Team</th>
                    <th>Email</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'var(--color-surface-elevated)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--color-accent)',
                          }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                              {member.name}
                            </div>
                            <div 
                              style={{ 
                                fontSize: '12px', 
                                color: 'var(--color-text-muted)',
                                fontFamily: 'monospace',
                              }}
                              title="Click to copy ID"
                              onClick={() => copyToClipboard(member.id)}
                            >
                              ID: {member.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-accent">
                          {member.team.name}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>{member.email}</td>
                      <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => deleteMember(member.id)}
                          className="btn btn-danger"
                          style={{ padding: 'var(--space-2) var(--space-3)', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  createdAt: string;
  _count: { members: number };
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
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Hackathon Admin Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Create Team */}
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
          <h2>Create Team</h2>
          <form onSubmit={createTeam}>
            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />
            <input
              type="text"
              placeholder="Project Title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />
            <textarea
              placeholder="Project Description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              required
              rows={4}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', resize: 'vertical' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              Create Team
            </button>
          </form>
        </div>

        {/* Create Member */}
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
          <h2>Create Member</h2>
          <form onSubmit={createMember}>
            <input
              type="text"
              placeholder="Member Name"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />
            <input
              type="email"
              placeholder="Email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            >
              <option value="">Select Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              Create Member
            </button>
          </form>
        </div>
      </div>

      {/* Teams List */}
      <div style={{ marginTop: '3rem' }}>
        <h2>Teams ({teams.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Team ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Members</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {team.id}
                </td>
                <td style={{ padding: '0.75rem' }}>{team.name}</td>
                <td style={{ padding: '0.75rem' }}>{team._count.members}</td>
                <td style={{ padding: '0.75rem' }}>
                  {new Date(team.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    onClick={() => deleteTeam(team.id)}
                    style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', color: 'red' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members List */}
      <div style={{ marginTop: '3rem' }}>
        <h2>Members ({members.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>User ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Team</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {member.id}
                </td>
                <td style={{ padding: '0.75rem' }}>{member.name}</td>
                <td style={{ padding: '0.75rem' }}>{member.email}</td>
                <td style={{ padding: '0.75rem' }}>{member.team.name}</td>
                <td style={{ padding: '0.75rem' }}>
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    onClick={() => deleteMember(member.id)}
                    style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', color: 'red' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

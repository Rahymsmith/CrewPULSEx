import React, { useCallback, useEffect, useState } from 'react';
import { Card, PageHead, Pill, Btn } from '../components/UI.jsx';
import { useStore } from '../store.jsx';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8787').replace(/\/$/, '');

export default function CrewManagement() {
  const { crewMembers: crew, crewLoading: loading, crewError: storeError, refreshCrew } = useStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    crew_role: '',
    mission_assignment: 'ARES-07',
    age: '',
    status: 'Active'
  });

  const loadCrew = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('cpx_token');
      if (!token) throw new Error('Please sign in to view your crew records.');

      const response = await fetch(`${API_URL}/api/crew`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load crew records.');
      setCrew(data.crew || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to the crew service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrew();
  }, [loadCrew]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('cpx_token');
      if (!token) throw new Error('Please sign in before adding a crew member.');

      const payload = {
        name: form.name.trim(),
        crew_role: form.crew_role.trim(),
        mission_assignment: form.mission_assignment.trim() || null,
        age: form.age === '' ? null : Number(form.age),
        status: form.status
      };

      const response = await fetch(`${API_URL}/api/crew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save crew member.');

      setForm({
        name: '',
        crew_role: '',
        mission_assignment: 'ARES-07',
        age: '',
        status: 'Active'
      });
      setMessage('Crew member saved successfully.');
    await refreshCrew();
    } catch (err) {
      setError(err.message || 'Unable to save crew member.');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '12px',
    marginTop: '7px',
    borderRadius: '8px',
    border: '1px solid rgba(142,160,204,.3)',
    background: 'rgba(15,25,48,.75)',
    color: 'inherit',
    font: 'inherit',
    boxSizing: 'border-box'
  };

  return (
    <>
      <PageHead
        eyebrow="CREW OPERATIONS"
        title="Crew management"
        desc="Manage crew directory records stored in your connected Supabase database."
      />

      <div className="grid g2">
        <Card title="Add crew member" sub="Create a persistent crew directory record">
          <form onSubmit={submit} style={{ display: 'grid', gap: 15 }}>
            <label>
              Full name
              <input
                style={fieldStyle}
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter crew member name"
              />
            </label>

            <label>
              Crew role
              <input
                style={fieldStyle}
                required
                minLength={2}
                maxLength={80}
                value={form.crew_role}
                onChange={(e) => setForm({ ...form, crew_role: e.target.value })}
                placeholder="e.g. Flight Engineer"
              />
            </label>

            <label>
              Mission assignment
              <input
                style={fieldStyle}
                maxLength={150}
                value={form.mission_assignment}
                onChange={(e) => setForm({ ...form, mission_assignment: e.target.value })}
                placeholder="e.g. ARES-07"
              />
            </label>

            <label>
              Age
              <input
                style={fieldStyle}
                type="number"
                min="18"
                max="100"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="Optional"
              />
            </label>

            <label>
              Status
              <select
                style={fieldStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Standby">Standby</option>
                <option value="Training">Training</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>

            <Btn variant="green" disabled={saving}>
              {saving ? 'Saving...' : 'Save crew member'}
            </Btn>
          </form>
          {message && <p className="small" style={{ color: '#6ee3a3' }}>{message}</p>}
          {error && <p className="small" role="alert" style={{ color: '#f87171' }}>{error}</p>}
        </Card>

        <Card title="Crew directory" sub={`${crew.length} saved record${crew.length === 1 ? '' : 's'} · Supabase database`}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
           <Btn variant="outline" onClick={refreshCrew}>Refresh records</Btn>
          </div>

          {loading ? (
            <p className="muted small">Loading crew records...</p>
          ) : crew.length === 0 ? (
            <p className="muted small">No crew records saved yet. Add your first crew member using the form.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {crew.map((member) => (
                <div
                  key={member.id}
                  style={{
                    padding: 14,
                    border: '1px solid rgba(142,160,204,.2)',
                    borderRadius: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <strong>{member.name}</strong>
                    <Pill status={member.status}>{member.status}</Pill>
                  </div>
                  <p className="muted small" style={{ margin: '7px 0 3px' }}>{member.crew_role}</p>
                  <p className="muted small" style={{ margin: 0 }}>
                    Mission: {member.mission_assignment || 'Unassigned'}
                    {member.age ? ` · Age: ${member.age}` : ''}
                  </p>
                  <p className="muted small" style={{ margin: '6px 0 0', fontSize: 11 }}>
                    Record ID: {member.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <p className="muted small" style={{ marginTop: 16 }}>
        Directory records are stored in Supabase. Health, sleep and biometric values in the other dashboard modules remain simulated demo data and are not updated by this directory.
      </p>
    </>
  );
}

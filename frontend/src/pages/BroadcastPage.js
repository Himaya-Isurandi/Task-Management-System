import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function BroadcastPage() {
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post('/api/admin/broadcast', {
        message,
        role: role || undefined,
      });
      toast.success(data.message);
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    } finally { setSending(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Send Announcement</h2>
      </div>
      <div className="task-detail-card" style={{ maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Message *</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="e.g. System maintenance scheduled for Sunday 2 AM"
              required
            />
          </div>
          <div className="form-group">
            <label>Send to</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="">Everyone</option>
              <option value="Project Manager">Project Managers only</option>
              <option value="Collaborator">Collaborators only</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Sending...' : 'Send Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
}

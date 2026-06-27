import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const EMPTY_USER = { name: '', email: '', role: 'Collaborator' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users', { params: { search } });
      setUsers(data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditUser(null); setForm(EMPTY_USER); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, role: u.role }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put(`/api/users/${editUser.id}`, form);
        toast.success('User updated');
      } else {
        await api.post('/api/users', form);
        toast.success('User created — welcome email sent!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/api/users/${u.id}`, { isActive: !u.isActive });
      toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Update failed'); }
  };

  const deleteUser = async (u) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${u.name}? This will permanently remove the user and all their associated data.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/users/${u.id}`);
      setUsers(prev => prev.filter(user => user.id !== u.id));
      toast.success(`User "${u.name}" deleted successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const roleColor = (r) => ({ Admin: '#ef4444', 'Project Manager': '#6366f1', Collaborator: '#10b981' }[r]);

  return (
    <div className="page">
      <div className="page-header">
        <h2>User Management</h2>
        <div className="header-actions">
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <button className="btn btn-primary" onClick={openCreate}>+ New User</button>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className="tag" style={{ background: roleColor(u.role) }}>{u.role}</span></td>
                  <td>
                    <span className="tag" style={{ background: u.isActive ? '#10b981' : '#888' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(u)}>Edit</button>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => toggleActive(u)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="empty-row">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editUser ? 'Edit User' : 'Create User'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={!!editUser} />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option>Collaborator</option>
                  <option>Project Manager</option>
                  <option>Admin</option>
                </select>
              </div>
              {!editUser && <p className="hint">A temporary password will be sent to the user's email.</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

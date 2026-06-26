import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import showToast from '../../components/ui/Toast';
import api from '../../services/api';
import { UserPlus, Edit2, Eye, Power, PowerOff, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser, refreshUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedUser, setSelectedUser] = useState(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState('Collaborator');
  const [emailError, setEmailError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const params = { page: 1, limit: 50 };
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/api/users', { params });
      setUsers(data.users || []);
    } catch (err) {
      showToast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      fetchUsers();
    }
  }, [fetchUsers, currentUser]);

  if (currentUser?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFullName('');
    setEmailInput('');
    setRoleInput('Collaborator');
    setEmailError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFullName(user.name);
    setEmailInput(user.email);
    setRoleInput(user.role);
    setEmailError('');
    setIsModalOpen(true);
  };

  const handleOpenView = async (user) => {
    try {
      const { data } = await api.get(`/api/users/${user.id}`);
      setSelectedUser(data.user);
      setModalMode('view');
      setIsModalOpen(true);
    } catch (err) {
      showToast.error('Failed to load user details');
    }
  };

  const handleToggleActive = async (user) => {
    if (user.isActive) {
      const confirmDeactivate = window.confirm(`Are you sure you want to deactivate ${user.name}?`);
      if (!confirmDeactivate) return;
      try {
        await api.put(`/api/users/${user.id}`, { name: user.name, role: user.role, isActive: false });
        showToast.success('User deactivated');
        fetchUsers();
      } catch (err) {
        showToast.error(err.response?.data?.message || 'Deactivation failed');
      }
    } else {
      try {
        await api.put(`/api/users/${user.id}`, { name: user.name, role: user.role, isActive: true });
        showToast.success(`User "${user.name}" activated`);
        fetchUsers();
      } catch (err) {
        showToast.error(err.response?.data?.message || 'Activation failed');
      }
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${user.name}? This will permanently remove the user and all their associated data.`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/api/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast.success(`User "${user.name}" deleted successfully`);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName || !emailInput) {
      showToast.error('Please fill in Name and Email fields.');
      return;
    }

    try {
      if (modalMode === 'create') {
        await api.post('/api/users', { name: fullName, email: emailInput, role: roleInput });
        showToast.success(`User "${fullName}" created! Welcome email sent.`);
      } else if (modalMode === 'edit') {
        await api.put(`/api/users/${selectedUser.id}`, { name: fullName, role: roleInput });
        showToast.success(`User "${fullName}" updated successfully!`);
        if (selectedUser.id === currentUser?.id) {
          await refreshUser();
        }
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      const errorCode = err.response?.data?.errorCode;
      if (errorCode === 'EMAIL_EXISTS') {
        setEmailError('This email is already registered');
      } else {
        showToast.error(err.response?.data?.message || 'Operation failed');
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesStatus = statusFilter === 'Active' ? u.isActive :
                         statusFilter === 'Inactive' ? !u.isActive : true;
    return matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>User Directory</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage role configurations and accounts</p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">
          <UserPlus size={16} /> Create User
        </Button>
      </div>

      {/* FILTER BAR */}
      <Card style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <SearchBar 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
            />
          </div>
          <select 
            className="input-field" 
            style={{ width: '160px', padding: '10px 12px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Collaborator">Collaborator</option>
          </select>
          <select 
            className="input-field" 
            style={{ width: '160px', padding: '10px 12px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {(searchQuery || roleFilter || statusFilter) && (
            <Button variant="text" onClick={() => { setSearchQuery(''); setRoleFilter(''); setStatusFilter(''); }}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* USER TABLE */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No users found.
                    </td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{u.name}</div>
                          {u.department && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.department}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td><Badge type={u.role}>{u.role}</Badge></td>
                    <td><Badge type={u.isActive ? 'active' : 'inactive'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="secondary" onClick={() => handleOpenView(u)} style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                          <Eye size={14} /> View
                        </Button>
                        <Button variant="secondary" onClick={() => handleOpenEdit(u)} style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                          <Edit2 size={14} /> Edit
                        </Button>
                        <Button 
                          variant={u.isActive ? 'danger' : 'secondary'} 
                          onClick={() => handleToggleActive(u)}
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        >
                          {u.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        {currentUser?.role === 'Admin' && (
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteUser(u)}
                            title={`Delete ${u.name}`}
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          >
                            <Trash2 size={14} /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE/EDIT MODAL */}
      <Modal isOpen={isModalOpen && modalMode !== 'view'} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Create New User' : 'Edit User'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <span className="input-label">Full Name *</span>
            <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="e.g. John Doe" />
          </div>
          <div className="input-group">
            <span className="input-label">Email *</span>
            <input className="input-field" type="email" value={emailInput} onChange={e => { setEmailInput(e.target.value); setEmailError(''); }} required placeholder="e.g. user@tms.com" disabled={modalMode === 'edit'} />
            {emailError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{emailError}</span>}
          </div>
          <div className="input-group">
            <span className="input-label">Role *</span>
            <select className="input-field" value={roleInput} onChange={e => setRoleInput(e.target.value)}>
              <option value="Collaborator">Collaborator</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          {modalMode === 'create' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 12px', background: 'rgba(74, 144, 226, 0.05)', borderRadius: '8px' }}>
              A temporary password will be emailed to the user automatically.
            </p>
          )}
          {modalMode === 'edit' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--warning)', padding: '8px 12px', background: 'rgba(255, 179, 71, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px', fontWeight: 'bold' }}>
              Warning: Permission changes take effect immediately.
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{modalMode === 'create' ? 'Create User' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal isOpen={isModalOpen && modalMode === 'view'} onClose={() => setIsModalOpen(false)} title="User Details">
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <Avatar name={selectedUser.name} size="lg" glow />
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedUser.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedUser.email}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <Badge type={selectedUser.role}>{selectedUser.role}</Badge>
                  <Badge type={selectedUser.isActive ? 'active' : 'inactive'}>{selectedUser.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </div>
            {selectedUser.department && (
              <div style={{ padding: '12px', background: 'rgba(74, 144, 226, 0.05)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Department: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedUser.department}</strong>
              </div>
            )}
            {selectedUser.bio && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedUser.bio}</p>
            )}
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} style={{ alignSelf: 'flex-end' }}>Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

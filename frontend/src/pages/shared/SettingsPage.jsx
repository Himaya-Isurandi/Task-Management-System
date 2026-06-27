import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import showToast from '../../components/ui/Toast';
import api from '../../services/api';
import {
  ShieldCheck,
  Palette,
  Smartphone,
  Lock,
  Moon
} from 'lucide-react';

export default function SettingsPage() {
  const [activeSettingsTab, setActiveSettingsTab] = useState('security');
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome Browser (Windows 11)', ip: '192.168.1.45', location: 'New York, US (Current Session)' },
    { id: 2, device: 'Safari Mobile (iPhone 14)', ip: '10.42.0.198', location: 'Chicago, US' }
  ]);
  const [accentColor, setAccentColor] = useState('#4A90E2');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const settingsTabs = [
    { id: 'security', label: 'Security & 2FA', icon: ShieldCheck },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one number');
      return;
    }

    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      showToast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleRevokeSession = (sessionId, deviceName) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    showToast.info(`Session on device "${deviceName}" has been revoked.`);
  };

  const handleRevokeAll = () => {
    setSessions(prev => prev.slice(0, 1));
    showToast.success('All other active sessions revoked.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>System Settings</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage security controls and workspace appearance.</p>
      </div>

      <div className="grid-2col" style={{ gridTemplateColumns: '0.5fr 1.5fr', alignItems: 'stretch' }}>
        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {settingsTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                  color: isActive ? 'var(--secondary-accent)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </Card>

        <Card style={{ padding: '30px' }}>
          {activeSettingsTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Security Audit</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Administer two-factor authentication and evaluate active devices.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Lock size={24} style={{ color: 'var(--secondary-accent)' }} />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Change Password</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Update your account password</span>
                  </div>
                </div>
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div className="input-group">
                    <input className="input-field" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="Current Password" />
                  </div>
                  <div className="input-group">
                    <input className="input-field" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="New Password" />
                    {passwordError && <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>{passwordError}</span>}
                  </div>
                  <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }}>Update Password</Button>
                </form>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.04)', border: '1px solid rgba(0, 212, 255, 0.2)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Smartphone size={24} style={{ color: 'var(--secondary-accent)' }} />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Two-Factor Authentication (2FA)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Add device layer verification checks on login attempts</span>
                  </div>
                </div>
                <button
                  onClick={() => { setTwoFactor(!twoFactor); showToast.success(`2FA successfully ${!twoFactor ? 'enabled' : 'disabled'}`); }}
                  style={{
                    background: twoFactor ? 'rgba(16, 217, 160, 0.15)' : 'rgba(255, 107, 107, 0.15)',
                    border: `1px solid ${twoFactor ? 'var(--success)' : 'var(--danger)'}`,
                    color: twoFactor ? 'var(--success)' : 'var(--danger)',
                    padding: '6px 14px',
                    borderRadius: '30px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {twoFactor ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                  <span className="input-label">Active login sessions</span>
                  {sessions.length > 1 && (
                    <Button variant="text" onClick={handleRevokeAll} style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: 0 }}>
                      Revoke All Others
                    </Button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sessions.map(session => (
                    <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{session.device}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>IP: {session.ip} - {session.location}</span>
                      </div>
                      {session.id !== 1 && (
                        <Button
                          variant="text"
                          onClick={() => handleRevokeSession(session.id, session.device)}
                          style={{ fontSize: '0.7rem', color: 'var(--danger)', padding: '4px 8px' }}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Appearance Options</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configure color accents and theme preferences.</p>
              </div>

              <div className="input-group">
                <span className="input-label">Visual Theme</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '10px', background: 'rgba(74, 144, 226, 0.05)', border: '1px solid var(--card-border)' }}>
                  <Moon size={20} style={{ color: 'var(--secondary-accent)' }} />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Deep Navy Space Gradient</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>High-fidelity dark gradient theme is optimized for system monitoring. Light theme currently locked.</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Accent glow color</span>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { color: '#4A90E2', name: 'Bright Blue' },
                    { color: '#00D4FF', name: 'Cyan Glow' },
                    { color: '#10D9A0', name: 'Emerald' },
                    { color: '#a855f7', name: 'Neon Purple' }
                  ].map(scheme => (
                    <button
                      key={scheme.color}
                      onClick={() => { setAccentColor(scheme.color); showToast.success(`Primary accent color set to "${scheme.name}"`); }}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: scheme.color,
                        border: accentColor === scheme.color ? '3px solid #fff' : '3px solid #0D1F3C',
                        cursor: 'pointer',
                        transition: 'transform 0.1s',
                        transform: accentColor === scheme.color ? 'scale(1.15)' : 'none',
                        boxShadow: `0 0 10px ${scheme.color}50`
                      }}
                      title={scheme.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

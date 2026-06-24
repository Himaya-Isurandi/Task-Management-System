import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import showToast from '../../components/ui/Toast';
import api from '../../services/api';
import { 
  Globe, 
  Bell, 
  ShieldCheck, 
  Palette, 
  Monitor, 
  ToggleLeft, 
  ToggleRight, 
  Smartphone, 
  Lock,
  Moon
} from 'lucide-react';

export default function SettingsPage() {
  const [activeSettingsTab, setActiveSettingsTab] = useState('account'); // 'account', 'notifications', 'security', 'appearance'

  // Account form state
  const [timezone, setTimezone] = useState('UTC-5 (EST)');
  const [language, setLanguage] = useState('en-US');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');

  // Notifications form state
  const [notifs, setNotifs] = useState({
    taskAssigned: { email: true, sms: false },
    milestoneReview: { email: true, sms: true },
    systemAlert: { email: false, sms: true }
  });

  // Security form state
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome Browser (Windows 11)', ip: '192.168.1.45', location: 'New York, US (Current Session)' },
    { id: 2, device: 'Safari Mobile (iPhone 14)', ip: '10.42.0.198', location: 'Chicago, US' }
  ]);

  // Appearance state
  const [accentColor, setAccentColor] = useState('#4A90E2');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validation: min 8 chars, uppercase, number
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

  const handleToggleNotif = (key, type) => {
    setNotifs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: !prev[key][type]
      }
    }));
  };

  const handleSaveSettings = () => {
    showToast.success("System configurations saved successfully!");
  };

  const handleRevokeSession = (sessionId, deviceName) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    showToast.info(`Session on device "${deviceName}" has been revoked.`);
  };

  const handleRevokeAll = () => {
    setSessions([sessions[0]]); // Keep only current
    showToast.success("All other active sessions revoked.");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER TITLE */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>System Settings</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Adjust UI localization variables, notification triggers, and active logins</p>
      </div>

      {/* TABS GRID */}
      <div className="grid-2col" style={{ gridTemplateColumns: '0.5fr 1.5fr', alignItems: 'stretch' }}>
        
        {/* Left Side Navigation Menu */}
        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'account', label: 'Account Settings', icon: Globe },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security & 2FA', icon: ShieldCheck },
            { id: 'appearance', label: 'Appearance', icon: Palette }
          ].map(tab => {
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

        {/* Right Side Content Panel */}
        <Card style={{ padding: '30px' }}>
          
          {/* TAB 1: Account settings */}
          {activeSettingsTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Account Settings</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configure timezone offsets and format variables</p>
              </div>

              <div className="input-group">
                <span className="input-label">Preferred Timezone</span>
                <select className="input-field" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  <option value="UTC-8 (PST)">UTC-8 (Pacific Standard Time)</option>
                  <option value="UTC-5 (EST)">UTC-5 (Eastern Standard Time)</option>
                  <option value="UTC+0 (GMT)">UTC+0 (Greenwich Mean Time)</option>
                  <option value="UTC+1 (CET)">UTC+1 (Central European Time)</option>
                  <option value="UTC+5:30 (IST)">UTC+5:30 (Indian Standard Time)</option>
                </select>
              </div>

              <div className="input-group">
                <span className="input-label">System Language</span>
                <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="es-ES">Español (España)</option>
                  <option value="fr-FR">Français (France)</option>
                  <option value="ja-JP">日本語 (日本)</option>
                </select>
              </div>

              <div className="input-group">
                <span className="input-label">Date Display Format</span>
                <select className="input-field" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-20)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 20/06/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/20/2026)</option>
                </select>
              </div>

              <Button onClick={handleSaveSettings} variant="primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
                Save Settings
              </Button>
            </div>
          )}

          {/* TAB 2: Notifications */}
          {activeSettingsTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Notification Preferences</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Toggle alerts dispatched by internal telemetry</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { key: 'taskAssigned', title: 'Task Assignments', desc: 'Notify me when I am assigned to a deliverable.' },
                  { key: 'milestoneReview', title: 'Milestone Reviews', desc: 'Notify me when project completion state updates.' },
                  { key: 'systemAlert', title: 'System Security Alerts', desc: 'Notify me of active session changes or configuration audits.' }
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '10px', background: 'rgba(74, 144, 226, 0.03)', border: '1px solid var(--card-border)' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{item.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.desc}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      {/* Email Toggle */}
                      <div 
                        onClick={() => handleToggleNotif(item.key, 'email')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                      >
                        {notifs[item.key].email ? (
                          <ToggleRight size={24} style={{ color: 'var(--secondary-accent)' }} />
                        ) : (
                          <ToggleLeft size={24} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <span>EMAIL</span>
                      </div>

                      {/* SMS Toggle */}
                      <div 
                        onClick={() => handleToggleNotif(item.key, 'sms')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                      >
                        {notifs[item.key].sms ? (
                          <ToggleRight size={24} style={{ color: 'var(--secondary-accent)' }} />
                        ) : (
                          <ToggleLeft size={24} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <span>SMS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveSettings} variant="primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
                Save Preferences
              </Button>
            </div>
          )}

          {/* TAB 3: Security & Sessions */}
          {activeSettingsTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Security Audit</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Administer Two-Factor Authentication and evaluate active devices</p>
              </div>

              {/* Change Password */}
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

              {/* 2FA Card toggling */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.04)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
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

              {/* Active Sessions list */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="input-label">Active login sessions</span>
                  {sessions.length > 1 && (
                    <Button variant="text" onClick={handleRevokeAll} style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: 0 }}>
                      Revoke All Others
                    </Button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sessions.map(sess => (
                    <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{sess.device}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>IP: {sess.ip} • {sess.location}</span>
                      </div>
                      {sess.id !== 1 && (
                        <Button 
                          variant="text" 
                          onClick={() => handleRevokeSession(sess.id, sess.device)}
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

          {/* TAB 4: Appearance */}
          {activeSettingsTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Appearance Options</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configure color accents and theme preferences</p>
              </div>

              {/* Theme: Dark Locked */}
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

              {/* Accent Picker */}
              <div>
                <span className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Accent glow color</span>
                <div style={{ display: 'flex', gap: '12px' }}>
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

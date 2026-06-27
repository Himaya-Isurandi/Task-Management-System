import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import showToast from '../../components/ui/Toast';
import { User, Mail, Phone, Lock, Edit, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (!name || !username || !email) {
      showToast.error("Name, username, and email fields are required.");
      return;
    }

    setSavingProfile(true);
    setTimeout(() => {
      updateProfile({
        name,
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        phone,
        bio
      });
      setSavingProfile(false);
      showToast.success("Profile details updated successfully!");
    }, 600);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error("New passwords do not match!");
      return;
    }

    if (newPassword.length < 8) {
      showToast.error("Password must be at least 8 characters long.");
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast.success("Security credentials modified successfully!");
    }, 800);
  };

  const handleUploadPhoto = () => {
    showToast.success("Mock photo selection opened. Image uploading is simulated!");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER TITLE */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>My Account Profile</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage your personal details, biography, and security settings</p>
      </div>

      <div className="grid-2col" style={{ gridTemplateColumns: '0.7fr 1.3fr', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: AVATAR CARD */}
        <Card style={{ textAlign: 'center', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={user?.name} size="xl" glow />
            
            {/* Image upload circle button overlay */}
            <button 
              onClick={handleUploadPhoto}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
                border: '2px solid #0D1F3C',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 8px rgba(0, 212, 255, 0.4)'
              }}
            >
              <Camera size={14} />
            </button>
          </div>

          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {user?.name}
            </h4>
            <span className="mono-font" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              @{user?.username}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <Badge type={user?.role}>{user?.role}</Badge>
            <Badge type="active">Active</Badge>
          </div>

          <div style={{ width: '100%', borderTop: '1px solid rgba(74, 144, 226, 0.15)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Department:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{user?.department}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>User ID:</span>
              <strong className="mono-font" style={{ color: 'var(--text-primary)' }}>{user?.id}</strong>
            </div>
          </div>
        </Card>

        {/* RIGHT COLUMN: DETAIL EDIT FORM */}
        <Card style={{ padding: '30px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>
            Personal Details
          </h4>

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="input-group">
                <span className="input-label">Full Name</span>
                <div className="input-field-prefixed">
                  <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}><User size={14} /></span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="input-group">
                <span className="input-label">Username</span>
                <div className="input-field-prefixed">
                  <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}>@</span>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="input-group">
                <span className="input-label">Email Address</span>
                <div className="input-field-prefixed">
                  <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}><Mail size={14} /></span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="input-group">
                <span className="input-label">Phone Number</span>
                <div className="input-field-prefixed">
                  <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}><Phone size={14} /></span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="input-group">
              <span className="input-label">Short Biography</span>
              <textarea 
                className="input-field" 
                rows="4" 
                placeholder="Write a short summary about your project roles and specialty skills..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <Button type="submit" variant="primary" disabled={savingProfile} style={{ alignSelf: 'flex-start', minWidth: '150px' }}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>
      </div>

      {/* BOTTOM ROW: PASSWORD CHANGE */}
      <Card style={{ padding: '30px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={18} style={{ color: 'var(--secondary-accent)' }} /> Security Credentials
        </h4>

        <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            <div className="input-group">
              <span className="input-label">Current Password</span>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <span className="input-label">New Password</span>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Min. 8 characters" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <span className="input-label">Confirm New Password</span>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Re-enter new password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" variant="secondary" disabled={savingPassword} style={{ alignSelf: 'flex-start', minWidth: '150px' }}>
            {savingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </Card>

    </div>
  );
}

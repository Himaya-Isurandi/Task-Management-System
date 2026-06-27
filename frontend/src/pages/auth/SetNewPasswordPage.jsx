import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import showToast from '../../components/ui/Toast';
import TaskNovaLogo from '../../components/layout/TaskNovaLogo';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SetNewPasswordPage() {
  const { setNewPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || localStorage.getItem('tasknova_reset_email') || '';
  const code = location.state?.code || localStorage.getItem('tasknova_reset_code') || '';
  const [newPassword, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      await setNewPassword(email, code, newPassword);
      localStorage.removeItem('tasknova_reset_email');
      localStorage.removeItem('tasknova_reset_code');
      showToast.success('Password updated successfully. Please log in.');
      navigate('/login');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Card style={{ width: '100%', maxWidth: '440px', padding: '36px', background: 'rgba(26, 58, 107, 0.65)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <TaskNovaLogo size={42} showText={true} />
        </div>

        {!email || !code ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Please request and verify a password reset code first.</p>
            <Link to="/forgot-password" style={{ color: 'var(--secondary-accent)' }}>Request reset code</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <span className="input-label">New Password</span>
              <div className="input-field-prefixed">
                <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}><Lock size={16} /></span>
                <input type="password" value={newPassword} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <span className="input-label">Confirm New Password</span>
              <div className="input-field-prefixed">
                <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}><Lock size={16} /></span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={submitting} style={{ width: '100%', padding: '14px', marginTop: '12px' }}>
              {submitting ? 'Saving...' : 'Set new password'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

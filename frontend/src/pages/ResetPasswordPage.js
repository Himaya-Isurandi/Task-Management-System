import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import showToast from '../components/ui/Toast';
import TaskNovaLogo from '../components/layout/TaskNovaLogo';
import { Lock } from 'lucide-react';

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, resetPassword } = useAuth();
  const navigate = useNavigate();

  if (!user?.mustResetPassword) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordPolicy.test(newPassword)) {
      showToast.error('Password must be at least 8 characters with uppercase, lowercase, number, and symbol.');
      return;
    }

    if (newPassword !== confirm) {
      showToast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(newPassword);
      showToast.success('Password changed successfully. Welcome in.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        className="animate-pulse-cyan"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '40px',
          background: 'rgba(26, 58, 107, 0.72)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <TaskNovaLogo size={42} showText />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <Lock size={30} style={{ color: 'var(--secondary-accent)', marginBottom: '12px' }} />
          <h1 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Change Your Password</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            You are using a temporary password. Please set a new password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <span className="input-label">New Password</span>
            <input
              className="input-field"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 8 chars, uppercase, number, symbol"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <span className="input-label">Confirm New Password</span>
            <input
              className="input-field"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              required
            />
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Required: at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol.
          </p>

          <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', padding: '14px', marginTop: '8px' }}>
            {loading ? 'Saving...' : 'Set New Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

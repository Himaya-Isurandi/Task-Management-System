import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import showToast from '../../components/ui/Toast';
import TaskNovaLogo from '../../components/layout/TaskNovaLogo';
import { Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { message } = await requestPasswordReset(email);
      localStorage.setItem('tasknova_reset_email', email);
      showToast.success(message || 'If this email is registered, you will receive a reset code');
      navigate('/reset-code', { state: { email } });
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Unable to request reset code');
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

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="input-label">Email Address</span>
            <div className="input-field-prefixed">
              <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}><Mail size={16} /></span>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={submitting} style={{ width: '100%', padding: '14px', marginTop: '12px' }}>
            {submitting ? 'Sending...' : 'Send reset code'}
          </Button>
        </form>

        <Link to="/login" style={{ display: 'block', marginTop: '18px', textAlign: 'center', color: 'var(--secondary-accent)', fontSize: '0.85rem' }}>
          Back to login
        </Link>
      </Card>
    </div>
  );
}

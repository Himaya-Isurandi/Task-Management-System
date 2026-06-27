import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import showToast from '../../components/ui/Toast';
import TaskNovaLogo from '../../components/layout/TaskNovaLogo';
import { Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ResetCodePage() {
  const { verifyResetCode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem('tasknova_reset_email') || '');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await verifyResetCode(email, code);
      localStorage.setItem('tasknova_reset_email', email);
      localStorage.setItem('tasknova_reset_code', code);
      navigate('/set-new-password', { state: { email, code } });
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Invalid or expired code. Please try again.');
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
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="input-group">
            <span className="input-label">Reset Code</span>
            <div className="input-field-prefixed">
              <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}><ShieldCheck size={16} /></span>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={submitting} style={{ width: '100%', padding: '14px', marginTop: '12px' }}>
            {submitting ? 'Checking...' : 'Verify code'}
          </Button>
        </form>

        <Link to="/forgot-password" style={{ display: 'block', marginTop: '18px', textAlign: 'center', color: 'var(--secondary-accent)', fontSize: '0.85rem' }}>
          Request a new code
        </Link>
      </Card>
    </div>
  );
}

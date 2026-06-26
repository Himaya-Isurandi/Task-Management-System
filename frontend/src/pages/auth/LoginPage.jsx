import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TaskNovaLogo from '../../components/layout/TaskNovaLogo';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import showToast from '../../components/ui/Toast';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { loginStep1, verifyLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting1, setSubmitting1] = useState(false);
  const [step, setStep] = useState(1);
  const [tempSession, setTempSession] = useState(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [submitting2, setSubmitting2] = useState(false);

  const otpInputRefs = useRef([]);
  const timerRef = useRef(null);

  const particles = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${12 + Math.random() * 10}s`,
    scale: 0.5 + Math.random() * 1.5,
  }));

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0) {
      clearInterval(timerRef.current);
      showToast.error('Verification code expired! Please request a new one.');
      setStep(1);
    }

    return () => clearInterval(timerRef.current);
  }, [step, timeLeft]);

  const handleOtpChange = (index, val) => {
    if (isNaN(val)) return;
    const newOtp = [...verificationCode];
    newOtp[index] = val.slice(-1);
    setVerificationCode(newOtp);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showToast.error('Please enter both email and password.');
      return;
    }

    setSubmitting1(true);
    try {
      const session = await loginStep1(email, password);
      setTempSession(session);
      setTimeLeft(300);
      setStep(2);
      setVerificationCode(['', '', '', '', '', '']);
      showToast.success('Verification code sent! Please check your registered email or backend console.');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setSubmitting1(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    const code = verificationCode.join('');

    if (!code || code.length !== 6) {
      showToast.error('Please enter the 6-digit verification code.');
      return;
    }

    setSubmitting2(true);
    try {
      const loggedUser = await verifyLogin(code, tempSession);
      showToast.success(`Hi, ${loggedUser.name}! Welcome back`);
      navigate('/dashboard');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Try again. Verification code incorrect or expired.');
    } finally {
      setSubmitting2(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      zIndex: 1
    }}>
      <div className="particle-background">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              transform: `scale(${p.scale})`,
            }}
          />
        ))}
      </div>

      <Card
        className="animate-pulse-cyan"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '40px',
          zIndex: 2,
          position: 'relative',
          background: 'rgba(26, 58, 107, 0.65)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <TaskNovaLogo size={42} showText={true} />
        </div>

        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--secondary-accent), transparent)',
          boxShadow: '0 0 8px var(--secondary-accent)',
          marginBottom: '32px'
        }} />

        {step === 1 && (
          <form onSubmit={handleStep1Submit}>
            <div className="input-group">
              <span className="input-label">Email Address</span>
              <div className="input-field-prefixed">
                <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="e.g. admin@tms.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '10px' }}>
              <span className="input-label">Password</span>
              <div className="input-field-prefixed">
                <span className="input-prefix" style={{ display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Link
              to="/forgot-password"
              style={{
                display: 'block',
                textAlign: 'right',
                color: 'var(--secondary-accent)',
                fontSize: '0.8rem',
                textDecoration: 'none',
                marginBottom: '24px'
              }}
            >
              Forgot password?
            </Link>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting1}
              className="animate-pulse-cyan"
              style={{ width: '100%', padding: '14px', textTransform: 'uppercase', fontSize: '0.95rem', letterSpacing: '0.05em', marginTop: '12px' }}
            >
              {submitting1 ? 'Connecting...' : 'Login'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                Verify Security Key
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Enter the 6-digit code sent to your email.
              </p>
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                {verificationCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    maxLength="1"
                    className="input-field"
                    style={{
                      width: '50px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      padding: 0
                    }}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  />
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '28px'
            }}>
              <span>Code expires in:</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                color: timeLeft < 60 ? 'var(--danger)' : 'var(--secondary-accent)',
                fontSize: '0.9rem',
                textShadow: timeLeft < 60 ? '0 0 8px rgba(255, 107, 107, 0.4)' : '0 0 8px rgba(0, 212, 255, 0.4)'
              }}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting2}
              style={{ width: '100%', padding: '14px', textTransform: 'uppercase', fontSize: '0.95rem', letterSpacing: '0.05em' }}
            >
              {submitting2 ? 'Verifying...' : 'Verify'}
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                display: 'block',
                margin: '20px auto 0',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}

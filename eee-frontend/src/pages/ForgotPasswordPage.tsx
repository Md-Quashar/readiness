import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useTheme } from '../context/ThemeContext';

export default function ForgotPasswordPage() {
  const { dark } = useTheme();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Password validation checks
  const validatePassword = (pwd: string) => ({
    minLength: pwd.length >= 8,
    hasUpperCase: /[A-Z]/.test(pwd),
    hasLowerCase: /[a-z]/.test(pwd),
    hasNumber: /\d/.test(pwd),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  });

  const passwordChecks = validatePassword(newPassword);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword({
        email: email.trim().toLowerCase(),
        new_password: newPassword,
      });
      setSuccess(res.data.message || 'Password has been reset successfully.');
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const d = err.response?.data;
      setError(d?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show }: { show: boolean }) =>
    show ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dark
        ? 'linear-gradient(135deg, #0d1117 0%, #161b22 60%, #0d1117 100%)'
        : 'linear-gradient(135deg, #0f2557 0%, #1a3a7c 60%, #0f2557 100%)',
      padding: '32px 16px',
    }}>
      <div className="register-card" style={{
        width: '100%', maxWidth: 480,
        background: 'var(--white)', borderRadius: 20,
        padding: '40px 44px',
        boxShadow: '0 24px 48px rgba(0,0,0,.25)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: 'var(--btn-primary-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, margin: 0 }}>Reset Password</h2>
            <p style={{ color: 'var(--gray5)', fontSize: 13, marginTop: 2 }}>Enter your registered email and new password</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="label">Registered Email</label>
            <input className="input" type="email" placeholder="you@lab.gov.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required />
          </div>

          <div className="form-group">
            <label className="label">New Password <span style={{ color: 'var(--gray4)', fontWeight: 400 }}>(min 8 characters)</span></label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                style={{ paddingRight: 40 }}
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                required />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--gray4)', display: 'flex', alignItems: 'center',
                }}
                tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <EyeIcon show={showPw} />
              </button>
            </div>

            {/* Password Requirements Feedback */}
            {newPassword && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--gray0)', borderRadius: 8, fontSize: 13 }}>
                {([
                  ['minLength', 'Minimum 8 characters'],
                  ['hasUpperCase', 'At least one capital letter (A-Z)'],
                  ['hasLowerCase', 'At least one lowercase letter (a-z)'],
                  ['hasNumber', 'At least one number (0-9)'],
                  ['hasSpecialChar', 'At least one special character (!@#$%^&*, etc.)'],
                ] as [keyof typeof passwordChecks, string][]).map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: key === 'hasSpecialChar' ? 0 : 6 }}>
                    <span style={{ color: passwordChecks[key] ? 'var(--green)' : 'var(--red)' }}>
                      {passwordChecks[key] ? '✓' : '✗'}
                    </span>
                    <span style={{ color: passwordChecks[key] ? 'var(--green)' : 'var(--gray5)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showConfirmPw ? 'text' : 'password'} placeholder="••••••••"
                style={{ paddingRight: 40 }}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                required />
              <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--gray4)', display: 'flex', alignItems: 'center',
                }}
                tabIndex={-1} aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
              >
                <EyeIcon show={showConfirmPw} />
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>Passwords do not match.</p>
            )}
          </div>

          <button type="submit"
            disabled={loading || !email || !isPasswordValid || newPassword !== confirmPassword}
            style={{
              width: '100%', padding: '12px', borderRadius: 'var(--radius)',
              background: 'var(--btn-primary-bg)', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 600,
              cursor: (loading || !email || !isPasswordValid || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer',
              opacity: (loading || !email || !isPasswordValid || newPassword !== confirmPassword) ? .7 : 1,
              marginTop: 4, fontFamily: 'var(--font)', transition: 'background .15s',
            }}
            onMouseOver={e => !(loading || !email || !isPasswordValid || newPassword !== confirmPassword) && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-hover)')}
            onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-bg)')}
          >
            {loading ? 'Resetting…' : 'Reset Password →'}
          </button>
        </form>

        <p style={{ marginTop: 22, textAlign: 'center', fontSize: 14, color: 'var(--gray5)' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign in</Link>
        </p>
        <p style={{ marginTop: 12, textAlign: 'center', fontSize: 14, color: 'var(--gray5)' }}>
          <Link to="/home" style={{ color: 'var(--blue)', fontWeight: 600 }}>Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

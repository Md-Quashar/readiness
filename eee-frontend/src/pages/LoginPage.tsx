import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      console.log('Submitting login for', form);
      const res = await authAPI.login(form);
      const { user, tokens } = res.data;
      login(user, tokens.access, tokens.refresh);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/assessment');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-layout" style={{
      minHeight: '100vh', display: 'flex',
      background: dark
        ? 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)'
        : 'linear-gradient(135deg, #0f2557 0%, #1a3a7c 50%, #0f2557 100%)',
    }}>
      {/* Left branding */}
      <div className="login-branding" style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 64px', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
            EEE Readiness Portal
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-head)', fontWeight: 400, color: '#fff',
          fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', lineHeight: 1.2,
          marginBottom: 16, letterSpacing: '-0.02em',
        }}>
          Forensic Lab<br />
          <span style={{ color: '#93c5fd', fontStyle: 'italic' }}>Readiness Check</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.75, maxWidth: 380 }}>
          Assess your laboratory's preparedness for EEE notification under Section 79A of the Information Technology Act, 2000.
        </p>

        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            'Structured assessment sections',
            'Instant compliance scoring',
            'PDF report generation',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,202,183,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <polyline points="2 6 5 9 10 3" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,.75)', fontSize: 14 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form panel */}
      <div className="login-form" style={{
        width: '100%', maxWidth: 540,
        background: 'var(--white)', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 44px',
      }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>Sign in</h2>
          <p style={{ color: 'var(--gray5)', fontSize: 14 }}>Enter your credentials to continue</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="form-group">
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="you@lab.gov.in"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                style={{ paddingRight: 40 }}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--gray4)', display: 'flex', alignItems: 'center',
                }}
                tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
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
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 'var(--radius)',
              background: 'var(--btn-primary-bg)', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? .7 : 1, transition: 'background .15s', marginTop: 4,
              fontFamily: 'var(--font)',
            }}
            onMouseOver={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-hover)')}
            onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-bg)')}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--gray5)' }}>
          New applicant?{' '}
          <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 600 }}>Create account</Link>
        </p>
        <p style={{ marginTop: 12, textAlign: 'center', fontSize: 14, color: 'var(--gray5)' }}>
          <Link to="/forgot-password" style={{ color: 'var(--blue)', fontWeight: 600 }}>Forgot password?</Link>
        </p>
        <p style={{ marginTop: 12, textAlign: 'center', fontSize: 14, color: 'var(--gray5)' }}>
          <Link to="/home" style={{ color: 'var(--blue)', fontWeight: 600 }}>Back to Home</Link>
        </p>

        <div style={{
          marginTop: 40, padding: '14px 16px',
          background: 'var(--gray0)', borderRadius: 'var(--radius)',
          border: '1px solid var(--gray2)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--gray5)', lineHeight: 1.65 }}>
            <strong style={{ color: 'var(--gray7)' }}>Authorised use only.</strong>{' '}
            This portal is restricted to forensic laboratories applying for EEE notification under the IT Act, 2000.
          </p>
        </div>
      </div>
    </div>
  );
}

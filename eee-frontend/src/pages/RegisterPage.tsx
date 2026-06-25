import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';


export default function RegisterPage() {
  const { login } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Password validation checks
  const validatePassword = (pwd: string) => ({
    minLength: pwd.length >= 8,
    hasUpperCase: /[A-Z]/.test(pwd),
    hasLowerCase: /[a-z]/.test(pwd),
    hasNumber: /\d/.test(pwd),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  });

  const passwordChecks = validatePassword(form.password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Name must not contain @ or look like an email
    if (/@/.test(form.name)) {
      setError('Name cannot contain "@". Please enter your full name, not an email.');
      return;
    }
    // Name should only contain letters, spaces, hyphens, dots, and apostrophes
    if (!/^[A-Za-z\s.'-]+$/.test(form.name.trim())) {
      setError('Name should only contain letters, spaces, hyphens, and dots.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(form.email.trim())) {
      setError('Please enter a valid email address (e.g. you@lab.gov.in).');
      return;
    }
    
    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    setError(''); setLoading(true);
    try {
      console.log('Submitting registration with data:', form);
      const res = await authAPI.register({ ...form, role: 'applicant' });
      const { user, tokens } = res.data;
      login(user, tokens.access, tokens.refresh);
      navigate('/assessment');
    } catch (err: any) {
      const d = err.response?.data;
      setError(typeof d === 'string' ? d : Object.values(d || {}).flat().join(', ') || 'Registration failed.');
    } finally { setLoading(false); }
  };

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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, margin: 0 }}>Create Account</h2>
            <p style={{ color: 'var(--gray5)', fontSize: 13, marginTop: 2 }}>EEE Readiness Portal</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input className="input" type="text" placeholder="Name"
              value={form.name}
              onChange={e => {
                const val = e.target.value.replace(/@/g, '');
                setForm({ ...form, name: val });
              }}
              pattern="[A-Za-z\s.'-]+"
              title="Name should only contain letters, spaces, hyphens, and dots"
              required />
          </div>

          <div className="form-group">
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="you@lab.gov.in"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
              title="Enter a valid email address"
              required />
          </div>

          <div className="form-group">
            <label className="label">Password <span style={{ color: 'var(--gray4)', fontWeight: 400 }}>(min 8 characters)</span></label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                style={{ paddingRight: 40 }}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                required />
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

            {/* Password Requirements Feedback */}
            {form.password && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--gray0)', borderRadius: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: passwordChecks.minLength ? 'var(--green)' : 'var(--red)' }}>
                    {passwordChecks.minLength ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordChecks.minLength ? 'var(--green)' : 'var(--gray5)' }}>
                    Minimum 8 characters
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: passwordChecks.hasUpperCase ? 'var(--green)' : 'var(--red)' }}>
                    {passwordChecks.hasUpperCase ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordChecks.hasUpperCase ? 'var(--green)' : 'var(--gray5)' }}>
                    At least one capital letter (A-Z)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: passwordChecks.hasLowerCase ? 'var(--green)' : 'var(--red)' }}>
                    {passwordChecks.hasLowerCase ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordChecks.hasLowerCase ? 'var(--green)' : 'var(--gray5)' }}>
                    At least one lowercase letter (a-z)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: passwordChecks.hasNumber ? 'var(--green)' : 'var(--red)' }}>
                    {passwordChecks.hasNumber ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordChecks.hasNumber ? 'var(--green)' : 'var(--gray5)' }}>
                    At least one number (0-9)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: passwordChecks.hasSpecialChar ? 'var(--green)' : 'var(--red)' }}>
                    {passwordChecks.hasSpecialChar ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordChecks.hasSpecialChar ? 'var(--green)' : 'var(--gray5)' }}>
                    At least one special character (!@#$%^&*, etc.)
                  </span>
                </div>
              </div>
            )}
          </div>



          <button type="submit" disabled={loading || !form.name || !form.email || !isPasswordValid}
            style={{
              width: '100%', padding: '12px', borderRadius: 'var(--radius)',
              background: 'var(--btn-primary-bg)', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 600, cursor: (loading || !form.name || !form.email || !isPasswordValid) ? 'not-allowed' : 'pointer',
              opacity: (loading || !form.name || !form.email || !isPasswordValid) ? .7 : 1, marginTop: 4, fontFamily: 'var(--font)',
              transition: 'background .15s',
            }}
            onMouseOver={e => !(loading || !form.name || !form.email || !isPasswordValid) && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-hover)')}
            onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--btn-primary-bg)')}
          >
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p style={{ marginTop: 22, textAlign: 'center', fontSize: 14, color: 'var(--gray5)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign in</Link>
        </p>
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--gray5)' }}>
          <Link to="/home" style={{ color: 'var(--blue)', fontWeight: 600 }}>Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

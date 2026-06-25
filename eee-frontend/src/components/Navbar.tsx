import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from "../context/ThemeContext";
import { SunIcon, MoonIcon, } from "../components/icons";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle, t } = useTheme();

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const links = isAdmin
    ? [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Questions', path: '/admin/questions' },
      { label: 'Assessments', path: '/admin/assessments' },
    ]
    : [{ label: 'My Assessment', path: '/assessment' }];

  return (
    <nav className="portal-nav">
      {/* Slim progress-style top strip */}
      <div style={{ height: 3, background: 'rgba(255,255,255,.08)' }}>
        <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }} />
      </div>

      <div className="portal-nav-inner">
        {/* Logo */}
        <div className="portal-logo" style={{ cursor: 'pointer' }}
          onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/assessment')}>
          <div className="portal-logo-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', lineHeight: 1.2 }}>EEE Readiness Portal</div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10 }}>Section 79A · IT Act 2000</div>
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(l => (
            <button key={l.path}
              className={`portal-nav-link${pathname === l.path ? ' active' : ''}`}
              onClick={() => navigate(l.path)}>
              {l.label}
            </button>
          ))}
        </div>

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{user?.name}</div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>{user?.role}</div>
          </div>
          <button onClick={() => { logout(); navigate('/home'); }}
            style={{
              background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
              color: 'rgba(255,255,255,.8)', borderRadius: 8, padding: '6px 14px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
            onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
          >Logout</button>

          {/* Dark mode toggle */}
          <button
            className="eee-toggle-btn"
            onClick={toggle}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              background: t.toggleBg,
              border: `1px solid ${t.toggleBorder}`,
              color: t.textSub,
              marginLeft: 4,
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = t.accent;
              (e.currentTarget as HTMLButtonElement).style.color = t.accent;
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = t.toggleBorder;
              (e.currentTarget as HTMLButtonElement).style.color = t.textSub;
            }}
          >
            {dark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </button>
        </div>
      </div>
    </nav>
  );
}

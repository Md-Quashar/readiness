import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function NotFoundPage() {
  const { dark, t } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 24px',
      background: dark
        ? 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f8fafc 100%)',
      color: t.text,
      fontFamily: "var(--font)",
      textAlign: 'center',
    }}>
      {/* Animated/visual illustration of 404 */}
      <div style={{ marginBottom: 32, position: 'relative' }}>
        <svg width="220" height="220" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background glow/orb */}
          <circle cx="120" cy="120" r="80" fill={dark ? 'rgba(88, 166, 255, 0.08)' : 'rgba(37, 99, 235, 0.06)'} />
          
          {/* Inner radar line */}
          <circle cx="120" cy="120" r="60" stroke={dark ? 'rgba(88, 166, 255, 0.2)' : 'rgba(37, 99, 235, 0.1)'} strokeWidth="2" strokeDasharray="6 4" />
          
          {/* Central 404 numbers */}
          <text x="120" y="128" textAnchor="middle" fill={dark ? '#58a6ff' : '#1d4ed8'} fontSize="48" fontWeight="800" fontFamily="var(--font-head)" letterSpacing="-0.03em">
            404
          </text>
          
          {/* Floating diagnostic nodes to link forensic feel */}
          <g opacity="0.8">
            <circle cx="60" cy="80" r="5" fill={dark ? '#388bfd' : '#2563EB'} />
            <line x1="60" y1="80" x2="90" y2="100" stroke={dark ? 'rgba(56, 139, 253, 0.4)' : 'rgba(37, 99, 235, 0.3)'} strokeWidth="1.5" />
          </g>
          
          <g opacity="0.8">
            <circle cx="180" cy="150" r="5" fill={dark ? '#f59e0b' : '#d97706'} />
            <line x1="180" y1="150" x2="150" y2="135" stroke={dark ? 'rgba(245, 158, 11, 0.4)' : 'rgba(217, 119, 6, 0.3)'} strokeWidth="1.5" />
          </g>

          <g opacity="0.6">
            <circle cx="160" cy="80" r="4" fill={dark ? '#58a6ff' : '#1d4ed8'} />
            <line x1="160" y1="80" x2="140" y2="95" stroke={dark ? 'rgba(88, 166, 255, 0.3)' : 'rgba(29, 78, 216, 0.2)'} strokeWidth="1.5" />
          </g>

          {/* Compass/Forensic target indicator */}
          <path d="M120 45v10M120 185v10M45 120h10M185 120h10" stroke={dark ? '#30363d' : '#cbd5e1'} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-head)',
        fontSize: 'clamp(24px, 5vw, 36px)',
        fontWeight: 700,
        marginBottom: 12,
        color: dark ? '#f0f6fc' : '#0f2557',
        letterSpacing: '-0.02em',
      }}>
        Page Not Found
      </h1>
      
      <p style={{
        color: dark ? '#8b949e' : '#64748B',
        fontSize: 15,
        lineHeight: 1.6,
        maxWidth: 480,
        marginBottom: 36,
      }}>
        The requested URL was not found on this server. It might have been moved, deleted, or is temporarily unavailable.
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
      }}>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
          style={{
            padding: '12px 28px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 'var(--radius-lg)',
            boxShadow: dark ? 'none' : '0 4px 12px rgba(15,37,87,0.15)',
          }}
        >
          Return to Portal
        </button>
        
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost"
          style={{
            padding: '12px 28px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 'var(--radius-lg)',
            background: dark ? '#161b22' : '#ffffff',
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

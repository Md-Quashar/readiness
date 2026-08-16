import { useTheme } from "../context/ThemeContext";
import { SunIcon, MoonIcon, PortalLogoIcon } from "../components/icons";
import { Link } from "react-router-dom";

interface NavbarProps {
  onStartClick?: () => void;
}

const NAV_LINKS = [
  //{ label: "User Guide", href: "https://docs.google.com/document/d/1PqAFzq8hjBNbr5n-Rs5rqtvTOEF1yZkB934W4Rrc_ZA/edit?tab=t.0" },
  { label: "Sign Up", href: "/register" },
];

export function Navbar({ onStartClick }: NavbarProps) {
  const { dark, toggle, t } = useTheme();

  return (
    <nav
      style={{
        background: t.navBg,
        borderBottom: `1px solid ${t.navBorder}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 24px", height: 62,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <a href="/home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: t.btnPrimary,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PortalLogoIcon size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: t.text, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            EEE Readiness Portal
          </span>
        </a>

        {/* Links + toggle */}
        <div className="eee-nav-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="eee-nav-link"
              style={{ color: t.textSub }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = t.accent;
                (e.currentTarget as HTMLAnchorElement).style.background = t.featureIconBg;
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = t.textSub;
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }}
            >
              <span>{link.label}</span>
            </a>
          ))}


          <Link
            className="eee-btn-primary"
            onClick={onStartClick}
            to="/login" style={{
              background: t.btnPrimary, color: t.btnText,
              fontSize: 13, padding: "7px 18px", borderRadius: 8,
              marginLeft: 6,
            }}
            onMouseOver={(e) => { (e.currentTarget as unknown as HTMLButtonElement).style.background = t.btnPrimaryHover; }}
            onMouseOut={(e) => { (e.currentTarget as unknown as HTMLButtonElement).style.background = t.btnPrimary; }}>Login</Link>

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

import { useTheme } from "../context/ThemeContext";

const FOOTER_LINKS = ["Terms & Conditions", "Privacy Policy", "Sitemap"];

export function Footer() {
  const { t } = useTheme();
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        background: t.footerBg,
        borderTop: `1px solid ${t.footerBorder}`,
        padding: "30px 24px",
        transition: "background 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}
      >
        <p style={{ color: t.footerText, fontSize: 13, textAlign: "center" }}>
          © {year} Government Portal · All Rights Reserved
        </p>
        <p style={{ color: t.footerText, fontSize: 13, textAlign: "center" }}>
          Developed by Centre for Distributed Computing, Jadavpur University
        </p>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          {FOOTER_LINKS.map((link, i) => (
            <>
              {i > 0 && <span key={`sep-${i}`} style={{ color: t.footerText, fontSize: 12, opacity: 0.5 }}>|</span>}
              <a
                key={link}
                href="#"
                style={{ color: t.footerText, fontSize: 13, textDecoration: "none", transition: "color 0.2s ease" }}
                onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#60a5fa"; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = t.footerText; }}
              >
                {link}
              </a>
            </>
          ))}
        </div>
      </div>
    </footer>
  );
}

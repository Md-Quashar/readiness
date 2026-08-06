import { useTheme } from "../context/ThemeContext";
import { useInView, useRevealStyle } from "../hooks/useInView";
import { ArrowRightIcon } from "../components/icons";
import { SectionBadge } from "../components/SectionBadge";

interface CTASectionProps {
  onStartClick?: () => void;
}

export function CTASection({ onStartClick }: CTASectionProps) {
  const { t } = useTheme();
  const { ref, inView } = useInView();

  return (
    <section style={{ padding: "72px 24px", background: t.bg, transition: "background 0.3s ease" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div
          ref={ref}
          style={{
            ...useRevealStyle(inView),
            background: t.ctaBg,
            border: `1px solid ${t.ctaBorder}`,
            borderRadius: 22,
            padding: "56px 40px",
            textAlign: "center",
          }}
        >
          <SectionBadge label="Ready to Begin?" />

          <h2
            className="eee-display-font"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: t.text, marginBottom: 16, letterSpacing: "-0.02em" }}
          >
            Start Your Readiness Check
          </h2>

          <p style={{ color: t.textSub, fontSize: 15, lineHeight: 1.75, maxWidth: 480, margin: "0 auto 36px" }}>
            Take the first step towards EEE notification. Complete your self-assessment and identify gaps in your laboratory's readiness before applying.
          </p>

          <a
            href="/register"
            onClick={onStartClick}
            style={{ background: t.btnPrimary, color: t.btnText, fontSize: 15, padding: "14px 36px", borderRadius: "var(--radius)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", fontWeight: 600 }}

          >
            Start Readiness Check <ArrowRightIcon size={16} />
          </a>


        </div>
      </div>
    </section>
  );
}

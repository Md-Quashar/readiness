import { useTheme } from "../context/ThemeContext";
import { useInView, useRevealStyle } from "../hooks/useInView";

export function DisclaimerSection() {
  const { t } = useTheme();
  const { ref, inView } = useInView();

  return (
    <section style={{ padding: "32px 24px 52px", background: t.bg, transition: "background 0.3s ease" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <div
          ref={ref}
          style={{
            ...useRevealStyle(inView),
            background: t.warningBg,
            border: `1px solid ${t.warningBorder}`,
            borderRadius: 14,
            padding: "20px 28px",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12, color: t.warningTitle, marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            ⚠ Disclaimer
          </div>
          <p style={{ color: t.textSub, fontSize: 13, lineHeight: 1.75 }}>
            This portal provides a readiness assessment for{" "}
            <strong style={{ color: t.text, fontWeight: 600 }}>self-evaluation purposes only</strong>.
            Results do not constitute accreditation. Notification of Examiner of Electronic Evidence
            is determined by the competent authority.
          </p>
        </div>
      </div>
    </section>
  );
}

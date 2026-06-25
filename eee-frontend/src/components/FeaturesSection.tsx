import { useTheme } from "../context/ThemeContext";
import { useInView, useRevealStyle } from "../hooks/useInView";
import { featureItems } from "../lib/theme";
import { iconMap } from "../components/icons";
import { SectionBadge } from "../components/SectionBadge";

export function FeaturesSection() {
  const { t } = useTheme();
  const { ref: headerRef, inView: headerIn } = useInView();
  const { ref: gridRef,   inView: gridIn   } = useInView();

  return (
    <section
      id="features"
      style={{ padding: "80px 24px", background: t.bg, transition: "background 0.3s ease" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div ref={headerRef} style={{ ...useRevealStyle(headerIn), textAlign: "center", marginBottom: 52 }}>
          <SectionBadge label="What You Get" />
          <h2
            className="eee-display-font"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 400, color: t.text, marginBottom: 12, letterSpacing: "-0.02em" }}
          >
            Portal Features
          </h2>
          <p style={{ color: t.textSub, fontSize: 15, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Comprehensive tools to evaluate and strengthen your laboratory's readiness for EEE notification.
          </p>
        </div>

        <div
          ref={gridRef}
          className="eee-features-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
        >
          {featureItems.map((feature, i) => {
            const IconComp = iconMap[feature.iconKey];
            return (
              <div
                key={feature.title}
                className="eee-feature-card"
                style={{
                  ...useRevealStyle(gridIn, i * 100),
                  background: t.featureCard,
                  border: `1px solid ${t.featureCardBorder}`,
                }}
                onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${t.accent}50`; }}
                onMouseOut={(e)  => { (e.currentTarget as HTMLDivElement).style.borderColor = t.featureCardBorder; }}
              >
                <div
                  style={{
                    width: 54, height: 54, borderRadius: 14,
                    background: t.featureIconBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: t.featureIconColor, marginBottom: 20,
                  }}
                >
                  {IconComp && <IconComp size={22} />}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: t.text, marginBottom: 10, letterSpacing: "-0.01em" }}>
                  {feature.title}
                </h3>
                <p style={{ color: t.textSub, fontSize: 14, lineHeight: 1.75 }}>
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

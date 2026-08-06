import { useTheme } from "../context/ThemeContext";
import { useInView, useRevealStyle } from "../hooks/useInView";
import { requirementNodes } from "../lib/theme";
import { iconMap } from "../components/icons";
import { SectionBadge } from "../components/SectionBadge";

export function RequirementsSection() {
  const { t } = useTheme();
  const { ref: headerRef, inView: headerIn } = useInView();
  const { ref: gridRef, inView: gridIn } = useInView();

  return (
    <section
      id="requirements"
      style={{ padding: "80px 24px", background: t.bg, transition: "background 0.3s ease" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div ref={headerRef} style={{ ...useRevealStyle(headerIn), textAlign: "center", marginBottom: 48 }}>
          <SectionBadge label="Readiness Framework" />
          <h2
            className="eee-display-font"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 400, color: t.text, marginBottom: 12, letterSpacing: "-0.02em" }}
          >
            Minimum Requirements
          </h2>
          <p style={{ color: t.textSub, fontSize: 15, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Five key pillars assessed across your laboratory to determine EEE notification readiness under the IT Act.
          </p>
        </div>


        {/* Cards grid */}
        <div
          ref={gridRef}
          className="eee-req-grid"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {requirementNodes.map((node, i) => {
            const IconComp = iconMap[node.iconKey];
            return (
              <div
                key={node.label}
                className="eee-req-card"
                style={{
                  ...useRevealStyle(gridIn, i * 70),
                  background: t.reqCard,
                  border: `1px solid ${t.reqCardBorder}`,
                  flex: "1 1 300px",
                  maxWidth: "340px",
                }}
              >
                <div
                  style={{
                    width: 50, height: 50, borderRadius: 12,
                    background: `${node.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: node.color, flexShrink: 0,
                  }}
                >
                  {IconComp && <IconComp size={26} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 6, letterSpacing: "-0.01em" }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7 }}>
                    {node.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

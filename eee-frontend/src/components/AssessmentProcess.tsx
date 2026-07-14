import { useTheme } from "../context/ThemeContext";
import { useInView, useRevealStyle } from "../hooks/useInView";
import { assessmentSteps } from "../lib/theme";
import { SectionBadge } from "../components/SectionBadge";

function StepArrow() {
  const { t } = useTheme();
  return (
    <div
      className="eee-steps-arrow"
      style={{ display: "flex", alignItems: "center", color: t.accent, opacity: 0.4, margin: "0 4px", flexShrink: 0 }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  );
}

export function ReadinessEvaluationProcess() {
  const { dark, t } = useTheme();
  const { ref: headerRef, inView: headerIn } = useInView();
  const { ref: stepsRef, inView: stepsIn } = useInView();

  return (
    <section
      id="process"
      style={{
        padding: "80px 24px",
        background: dark ? "#0a0f16" : "#f1f5f9",
        transition: "background 0.3s ease",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div ref={headerRef} style={{ ...useRevealStyle(headerIn), textAlign: "center", marginBottom: 52 }}>
          <SectionBadge label="How It Works" />
          <h2
            className="eee-display-font"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 400, color: t.text, marginBottom: 12, letterSpacing: "-0.02em" }}
          >
            Readiness Evaluation Process
          </h2>
          <p style={{ color: t.textSub, fontSize: 15, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
            Four simple steps to complete your laboratory readiness evaluation.
          </p>
        </div>

        <div ref={stepsRef} className="eee-steps-row" style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          {assessmentSteps.map((step, i) => (
            <>
              <div
                key={step.num}
                className="eee-step-card"
                style={{
                  ...useRevealStyle(stepsIn, i * 90),
                  background: t.stepCard,
                  border: `1px solid ${t.stepCardBorder}`,
                }}
              >
                <div
                  className="eee-display-font"
                  style={{ fontSize: 40, color: t.stepNum, marginBottom: 14, opacity: 0.75, lineHeight: 1 }}
                >
                  {step.num}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 8, lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: t.stepText, lineHeight: 1.65 }}>
                  {step.desc}
                </div>
              </div>
              {i < assessmentSteps.length - 1 && <StepArrow key={`arrow-${i}`} />}
            </>
          ))}
        </div>
      </div>
    </section>
  );
}

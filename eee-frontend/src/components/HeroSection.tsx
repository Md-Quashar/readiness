import { useTheme } from "../context/ThemeContext";
import { useInView, useRevealStyle } from "../hooks/useInView";
import { ArrowRightIcon } from "../components/icons";
import { SectionBadge } from "../components/SectionBadge";
import { Link } from "react-router";



export function HeroSection() {
  const { t } = useTheme();
  const { ref: badgeRef, inView: badgeIn } = useInView();
  const { ref: headRef,  inView: headIn  } = useInView();
  const { ref: bodyRef,  inView: bodyIn  } = useInView();

  return (
    <section
      style={{
        background: t.heroBg,
        padding: "80px 24px 88px",
        position: "relative",
        overflow: "hidden",
        transition: "background 0.3s ease",
      }}
    >
      {/* Decorative orbs */}
      <div aria-hidden="true" style={{ position: "absolute", top: -100, right: -100, width: 480, height: 480, borderRadius: "50%", background: t.orb1, filter: "blur(70px)", pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: -80, left: -80, width: 360, height: 360, borderRadius: "50%", background: t.orb2, filter: "blur(50px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", position: "relative" }}>

        <div ref={badgeRef} style={useRevealStyle(badgeIn, 0)}>
          <SectionBadge label="Section 79A — IT Act, 2000" />
        </div>

        <h1
          ref={headRef}
          className="eee-display-font"
          style={{
            ...useRevealStyle(headIn, 80),
            fontSize: "clamp(2rem, 5vw, 3.4rem)",
            fontWeight: 400, lineHeight: 1.18,
            color: t.text, marginBottom: 22, letterSpacing: "-0.02em",
          }}
        >
          EEE Application{" "}
          <span style={{ color: t.accent, fontStyle: "italic" }}>Readiness</span>{" "}
          Check Portal
        </h1>

        <p
          ref={bodyRef}
          style={{
            ...useRevealStyle(bodyIn, 160),
            color: t.textSub, fontSize: "clamp(14px, 2vw, 17px)",
            lineHeight: 1.8, maxWidth: 660, margin: "0 auto 40px",
          }}
        >
          A platform to assess the preparedness of laboratories applying for notification as an{" "}
          <strong style={{ color: t.text, fontWeight: 600 }}>Examiner of Electronic Evidence (EEE)</strong>{" "}
          under Section 79A of the Information Technology Act, 2000.
        </p>

        <div style={{ ...useRevealStyle(bodyIn, 240), display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
          <Link
            className="eee-btn-primary"
            to="/register"
            style={{ background: t.btnPrimary, color: t.btnText, fontSize: 15, padding: "14px 36px" }}
            onMouseOver={(e) => { (e.currentTarget as unknown as HTMLButtonElement).style.background = t.btnPrimaryHover; }}
            onMouseOut={(e)  => { (e.currentTarget as unknown as HTMLButtonElement).style.background = t.btnPrimary; }}
          >
            Start Readiness Check <ArrowRightIcon size={15} />
          </Link>

         
        </div>

      </div>
    </section>
  );
}

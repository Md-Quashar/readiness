import { AssessmentProcess } from "../components/AssessmentProcess";
import { CTASection } from "../components/CTASection";
import { DisclaimerSection } from "../components/DisclaimerSection";
import { FeaturesSection } from "../components/FeaturesSection";
import { Footer } from "../components/Footer";
import { HeroSection } from "../components/HeroSection";
import { Navbar } from "../components/NavbarHome";
import { RequirementsSection } from "../components/RequirementsSection";
import { SectionDivider } from "../components/SectionDivider";
import { useTheme } from "../context/ThemeContext";

interface HomePageProps {
  onStartClick?: () => void;
}

export function HomePage({ onStartClick }: HomePageProps) {
  const { t } = useTheme();

  return (
    <div
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: t.bg,
        color: t.text,
        minHeight: "100vh",
        transition: "background 0.3s ease, color 0.3s ease",
        fontSize: "15px",
      }}
    >
      <Navbar onStartClick={onStartClick} />

      <main>
        <HeroSection />
        <SectionDivider />
        <RequirementsSection />
        <SectionDivider />
        <FeaturesSection />
        <AssessmentProcess />
        <CTASection onStartClick={onStartClick} />
        <DisclaimerSection />
      </main>

      <Footer />
    </div>
  );
}

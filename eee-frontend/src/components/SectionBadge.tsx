import { useTheme } from "../context/ThemeContext";
import { CircleDotIcon } from "../components/icons";

interface SectionBadgeProps {
  label: string;
}

export function SectionBadge({ label }: SectionBadgeProps) {
  const { t } = useTheme();
  return (
    <div
      className="eee-section-badge"
      style={{
        background: t.badgeBg,
        color: t.badgeText,
        border: `1px solid ${t.badgeBorder}`,
      }}
    >
      <CircleDotIcon size={8} />
      {label}
    </div>
  );
}

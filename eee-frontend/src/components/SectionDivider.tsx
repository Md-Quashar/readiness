import { useTheme } from "../context/ThemeContext";

export function SectionDivider() {
  const { t } = useTheme();
  return (
    <div
      style={{
        height: 1,
        background: t.divider,
        maxWidth: 1100,
        margin: "0 auto",
        transition: "background 0.3s ease",
      }}
    />
  );
}
56
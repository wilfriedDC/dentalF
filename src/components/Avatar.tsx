interface AvatarProps {
  name?: string;
  size?: number;
  bg?: string;
  color?: string;
}

// Palette sobre, désaturée — cohérente avec un outil médical/pro
const PALETTE = [
  { bg: "#E7F3F3", color: "#0C7C7C" }, // teal (couleur de marque)
  { bg: "#EEF0F4", color: "#4B5768" }, // slate
  { bg: "#F1EEF7", color: "#6B5B95" }, // violet mat
  { bg: "#F4EFEA", color: "#8A6D4F" }, // taupe / bronze
  { bg: "#EAF0EC", color: "#3F6B52" }, // vert sauge
  { bg: "#F3EDEE", color: "#8A4F5B" }, // bordeaux mat
];

function getInitials(name?: string): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPalette(name?: string) {
  if (!name) return PALETTE[0];

  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return PALETTE[hash % PALETTE.length];
}

export function Avatar({ name, size = 36, bg, color }: AvatarProps) {
  const initials = getInitials(name);
  const palette = getPalette(name);

  const background = bg ?? palette.bg;
  const textColor = color ?? palette.color;

  return (
    <div
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background,
        color: textColor,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: size * 0.36,
        letterSpacing: 0.2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.04)",
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
}
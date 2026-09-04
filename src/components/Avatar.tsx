export function Avatar({ name, size = 36, bg = "#E0F5F5", color = "#0EA5A5" }: { name: string; size?: number; bg?: string; color?: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: size * 0.36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function StatCard({ label, value, sub, color = "#0EA5A5", icon }: { label: string; value: string | number; sub: string; color?: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{label}</div>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "18", color, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#1F2937", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
}

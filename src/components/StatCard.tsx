interface ProgressInfo {
  percent: number; // 0-100
  label: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string; // ex: "aujourd'hui", "patients"
  caption?: string; // texte simple sous la valeur (si pas de progress)
  color?: string;
  icon: React.ReactNode;
  featured?: boolean; // carte pleine couleur, mise en avant (comme "Blood pressure" sur la référence)
  progress?: ProgressInfo; // barre de progression fine, avec % réel
}

export function StatCard({
  label,
  value,
  unit,
  caption,
  color = "#0EA5A5",
  icon,
  featured = false,
  progress,
}: StatCardProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl p-4 transition-shadow hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] ${
        featured ? "bg-primary shadow-[0_8px_20px_-6px_rgba(14,165,165,0.5)]" : "border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      }`}
    >
      {/* Icône + valeur — même ligne, comme sur la référence */}
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${featured ? "bg-white/20 text-white" : ""}`}
          style={!featured ? { background: `${color}18`, color } : undefined}
        >
          {icon}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-[16px] font-bold ${featured ? "text-white" : ""}`} style={!featured ? { color } : undefined}>
            {value}
          </span>
          {unit && (
            <span className={`text-[11px] font-medium ${featured ? "text-white/70" : "text-text-subtle"}`}>{unit}</span>
          )}
        </div>
      </div>

      {/* Label — bien plus discret que la valeur, comme sur la référence */}
      <div className={`mt-3 text-[13.5px] font-semibold ${featured ? "text-white" : "text-text"}`}>{label}</div>

      {/* Légende ou progression réelle, jamais les deux */}
      {progress ? (
        <div className="mt-2.5">
          <div className={`h-1 overflow-hidden rounded-full ${featured ? "bg-white/25" : "bg-surface-2"}`}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, progress.percent))}%`,
                background: featured ? "#fff" : color,
              }}
            />
          </div>
          <div className={`mt-1.5 text-[11px] ${featured ? "text-white/70" : "text-text-subtle"}`}>{progress.label}</div>
        </div>
      ) : caption ? (
        <div className={`mt-1 text-[11px] leading-relaxed ${featured ? "text-white/70" : "text-text-subtle"}`}>
          {caption}
        </div>
      ) : null}
    </div>
  );
}
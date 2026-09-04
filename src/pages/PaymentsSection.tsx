import { useState } from "react";
import type { PaymentMethod } from "../types";
import { PAYMENT_TRANSACTIONS } from "../data/mockData";
import { StatusBadge } from "../components/StatusBadge";
import { formatDate } from "../utils/formatDate";

const METHOD_LABEL: Record<PaymentMethod, string> = { Cash: "Espèces", Card: "Carte", Insurance: "Assurance", Transfer: "Virement" };

export function PaymentsSection() {
  const [filter, setFilter] = useState<"all" | "Paid" | "Unpaid" | "Partial">("all");

  const filtered = PAYMENT_TRANSACTIONS.filter(t => filter === "all" || t.status === filter);

  const totalIn = PAYMENT_TRANSACTIONS.reduce((acc, t) => acc + t.amount, 0);
  const totalDue = PAYMENT_TRANSACTIONS.reduce((acc, t) => acc + t.balance, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#1F2937" }}>Suivi des paiements</div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { label: "Total encaissé", value: `${totalIn} €`, color: "#10B981", bg: "#D1FAE5" },
          { label: "Total dû", value: `${totalDue} €`, color: "#EF4444", bg: "#FEE2E2" },
          { label: "Transactions", value: PAYMENT_TRANSACTIONS.length, color: "#0EA5A5", bg: "#E0F5F5" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12.5, color: "#6B7280" }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.color, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>{c.value}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: c.bg }} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["all", "Paid", "Partial", "Unpaid"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", border: "1.5px solid", borderRadius: 20, fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: filter === f ? 600 : 400, borderColor: filter === f ? "#0EA5A5" : "#E5E7EB", background: filter === f ? "#E0F5F5" : "#fff", color: filter === f ? "#0EA5A5" : "#6B7280" }}
          >
            {f === "all" ? "Tous" : f === "Paid" ? "Payés" : f === "Partial" ? "Partiels" : "Impayés"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "110px 160px 1fr 100px 120px 100px 90px", padding: "12px 20px", background: "#F8F9FA", borderBottom: "1px solid #F3F4F6" }}>
          {["Date", "Patient", "Acte", "Montant", "Méthode", "Solde restant", "Statut"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
          ))}
        </div>
        {filtered.map((t, i) => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "110px 160px 1fr 100px 120px 100px 90px", padding: "13px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#9CA3AF" }}>{formatDate(t.date)}</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.patient}</div>
            <div style={{ fontSize: 12.5, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.consultation}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13.5, fontWeight: 600, color: t.amount > 0 ? "#10B981" : "#9CA3AF" }}>{t.amount > 0 ? `+${t.amount} €` : "—"}</div>
            <div>
              <span style={{ fontSize: 12, background: "#F3F4F6", color: "#6B7280", padding: "3px 9px", borderRadius: 5, fontFamily: "'DM Mono', monospace" }}>{METHOD_LABEL[t.method]}</span>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: t.balance > 0 ? "#EF4444" : "#10B981" }}>{t.balance > 0 ? `${t.balance} €` : "✓"}</div>
            <div><StatusBadge status={t.status} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

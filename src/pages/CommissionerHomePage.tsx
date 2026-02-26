//src/pages/CommissionerHomePage.tsx
// src/pages/CommissionerHomePage.tsx
import { useNavigate } from "react-router-dom";

export default function CommissionerHomePage() {
  const navigate = useNavigate();

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 12 }}>
        <SectionCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div>
              <h1 style={{ fontSize: 24, margin: 0 }}>Commissioner Console</h1>
              <p style={{ color: "var(--fff-muted)", marginTop: 8, marginBottom: 0 }}>
                Create and manage leagues, invite players, and deal teams.
              </p>
            </div>

            <button
              onClick={() => navigate("/march-basketball-foam-fingers/lets-go")}
              style={{ ...buttonBase, ...buttonSecondary }}
            >
              Back
            </button>
          </div>
        </SectionCard>

        <SectionCard>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Workflow</div>
          <ol style={{ margin: 0, paddingLeft: 18, color: "var(--fff-text)" }}>
            <li>Create league</li>
            <li>Set player count target (2 / 4 / 8 / 16)</li>
            <li>Invite players</li>
            <li>Wait until league is full</li>
            <li>Deal teams</li>
            <li>Track leaderboard</li>
          </ol>
        </SectionCard>

        <SectionCard>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Actions</div>
          <div style={{ display: "grid", gap: 10 }}>
            <button
              onClick={() => navigate("/march-basketball-foam-fingers/commissioner/leagues/new")}
              style={{ ...buttonBase, ...buttonPrimary }}
            >
              Create League
            </button>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--fff-surface)",
        border: "1px solid var(--fff-border)",
        borderRadius: 16,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}

const buttonBase: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--fff-border)",
  padding: "10px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const buttonPrimary: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", // subtle, not neon
  color: "var(--fff-text)",
  border: "1px solid var(--fff-border)",
};

const buttonSecondary: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
};
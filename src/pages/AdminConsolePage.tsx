// src/pages/AdminConsolePage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminConsolePage() {
  const navigate = useNavigate();

  // MVP defaults (replace later with selector/dropdowns)
  const [leagueId, setLeagueId] = useState("3001");
  const [tournamentId, setTournamentId] = useState("202601");

  const leagueIdNum = Number(leagueId);
  const tournamentIdNum = Number(tournamentId);
  const hasValidParams =
    Number.isInteger(leagueIdNum) &&
    Number.isInteger(tournamentIdNum) &&
    leagueIdNum > 0 &&
    tournamentIdNum > 0;

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 12 }}>
        <SectionCard>
          <h1 style={{ fontSize: 24, margin: 0 }}>Admin Console</h1>
          <p style={{ color: "var(--fff-muted)", marginTop: 8, marginBottom: 0 }}>
            March Basketball Foam Fingers admin tools
          </p>
        </SectionCard>

        <SectionCard>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Working Context</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--fff-muted)" }}>League ID</span>
              <input
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                placeholder="3001"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--fff-muted)" }}>Tournament ID</span>
              <input
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                placeholder="202601"
                style={inputStyle}
              />
            </label>
          </div>

          {!hasValidParams && (
            <div style={{ marginTop: 10 }}>
              <ErrorBox title="Invalid IDs" message="Enter positive numeric league and tournament IDs." />
            </div>
          )}
        </SectionCard>

        <SectionCard>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Admin Actions</div>

          <div style={{ display: "grid", gap: 10 }}>
            <button
              onClick={() => navigate("/march-basketball-foam-fingers/admin/tournament-field-setup")}
              style={buttonSecondary}
            >
              Tournament Team Setup
            </button>

            <button
              disabled={!hasValidParams}
              onClick={() =>
                navigate(
                  `/march-basketball-foam-fingers/league/${leagueIdNum}/tournament/${tournamentIdNum}/admin-winners`
                )
              }
              style={buttonPrimary}
            >
              Admin Winners Console
            </button>

            <button
              disabled={!hasValidParams}
              onClick={() =>
                navigate(
                  `/march-basketball-foam-fingers/league/${leagueIdNum}/tournament/${tournamentIdNum}/leaderboard`
                )
              }
              style={buttonSecondary}
            >
              Leaderboard
            </button>

          <button
            disabled={!hasValidParams}
            onClick={() =>
              navigate(
                `/march-basketball-foam-fingers/league/${leagueIdNum}/tournament/${tournamentIdNum}/live-bracket`
              )
            }
            style={buttonSecondary}
          >
            Live Bracket
          </button>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--fff-border)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
  borderRadius: 10,
  padding: "10px 12px",
};

const buttonPrimary: React.CSSProperties = {
  background: "var(--fff-accent)",
  color: "#0B3323",
  border: "none",
  fontWeight: 800,
};

const buttonSecondary: React.CSSProperties = {
  border: "1px solid var(--fff-border)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
  fontWeight: 600,
};

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

function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        padding: 12,
        background: "rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "var(--fff-muted)", fontSize: 14 }}>{message}</div>
    </div>
  );
}
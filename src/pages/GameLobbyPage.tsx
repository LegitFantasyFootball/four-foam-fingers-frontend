import { useNavigate } from "react-router-dom";

export default function GameLobbyPage() {
  const navigate = useNavigate();

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            background: "var(--fff-surface)",
            border: "1px solid var(--fff-border)",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h1 style={{ fontSize: 24, margin: 0 }}>March Basketball Foam Fingers</h1>

          <p style={{ color: "var(--fff-muted)", marginTop: 8, marginBottom: 0 }}>
            Join a league, get assigned teams, and track the tournament live.
          </p>

          <p style={{ color: "var(--fff-muted)", marginTop: 8, marginBottom: 0, fontSize: 13 }}>
            Pick a path below to continue.
          </p>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <button
            onClick={() => navigate("/march-basketball-foam-fingers/lets-go")}
            style={{
              background: "var(--fff-accent)",
              color: "#0B3323",
              border: "none",
              fontWeight: 700,
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            Let’s Go
          </button>

          <button
            onClick={() => navigate("/march-basketball-foam-fingers/player/my-leagues")}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--fff-border)",
              color: "inherit",
              fontWeight: 700,
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            My Leagues
          </button>

          <button
            onClick={() => navigate("/march-basketball-foam-fingers/player/join")}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--fff-border)",
              color: "inherit",
              fontWeight: 700,
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            Join League
          </button>

          <button
            onClick={() => navigate("/march-basketball-foam-fingers/commissioner")}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--fff-border)",
              color: "inherit",
              fontWeight: 700,
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            Commissioner
          </button>
        </div>

        <div
          style={{
            marginTop: 14,
            color: "var(--fff-muted)",
            fontSize: 12,
            lineHeight: "16px",
          }}
        >
          Live Bracket and Leaderboard are league-specific and open after selecting a league.
        </div>
      </div>
    </main>
  );
}
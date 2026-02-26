import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetchJson } from "../lib/api";

function getLeagueIdFromResponse(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;

  if ("league_id" in data && typeof (data as { league_id?: unknown }).league_id === "number") {
    return (data as { league_id: number }).league_id;
  }

  if ("id" in data && typeof (data as { id?: unknown }).id === "number") {
    return (data as { id: number }).id;
  }

  return null;
}

type CreateLeaguePayload = {
  league_name: string;
  user_count: number;
};

type CreateLeagueResponse = {
  id?: number;
  league_id?: number;
  league_name?: string;
  tournament_id?: number;
  user_count?: number;
  [key: string]: unknown;
};

const PLAYER_COUNT_OPTIONS = [2, 4, 8, 16] as const;

export default function CreateLeaguePage() {
  const navigate = useNavigate();

  const [leagueName, setLeagueName] = useState("");
  const [playerCount, setPlayerCount] = useState<string>("8");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const playerCountNum = Number(playerCount);

  const canSubmit = useMemo(() => {
    return (
      leagueName.trim().length > 0 &&
      PLAYER_COUNT_OPTIONS.includes(playerCountNum as (typeof PLAYER_COUNT_OPTIONS)[number])
    );
  }, [leagueName, playerCountNum]);

  async function handleCreateLeague() {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const payload: CreateLeaguePayload = {
      league_name: leagueName.trim(),
      user_count: playerCountNum,
    };

    try {
        const data = await apiFetchJson<CreateLeagueResponse>("/commissioner/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        });

      const leagueId = getLeagueIdFromResponse(data);
      if (leagueId !== null) {
        navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueId}`);
      } else {
        setError("Created league, but could not read league ID from response.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create league failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: 12 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", display: "grid", gap: 10 }}>
        <SectionCard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Create League</div>
            <button
              onClick={() => navigate("/march-basketball-foam-fingers/commissioner")}
              style={{ ...buttonBase, ...buttonSecondary, padding: "10px 12px" }}
            >
              Back
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>League name</span>
              <input
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="Office Bracket League"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Players</span>
              <select
                value={playerCount}
                onChange={(e) => setPlayerCount(e.target.value)}
                style={inputStyle}
              >
                {PLAYER_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} players
                  </option>
                ))}
              </select>
            </label>

            {!canSubmit && (
              <div style={{ color: "var(--fff-muted)", fontSize: 13 }}>
                Enter a league name.
              </div>
            )}

            {error && <ErrorBox title="Create failed" message={error} />}

            <button
              disabled={!canSubmit || isSubmitting}
              onClick={handleCreateLeague}
                style={{
                ...buttonBase,
                ...(canSubmit ? buttonPrimary : buttonSecondary),
                opacity: !canSubmit || isSubmitting ? 0.6 : 1,
                cursor: !canSubmit || isSubmitting ? "not-allowed" : "pointer",
                padding: "14px 12px",
                }}
            >
              {isSubmitting ? "Creating..." : "Create"}
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
        padding: 14,
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
      <div style={{ fontWeight: 900, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "var(--fff-muted)", fontSize: 14, whiteSpace: "pre-wrap" }}>
        {message}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--fff-muted)",
  fontWeight: 800,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--fff-border)",
  background: "rgba(255,255,255,0.05)",
  color: "var(--fff-text)",
  borderRadius: 12,
  padding: "14px 12px",
  fontSize: 16, // phone friendly
  outline: "none",
};

// IMPORTANT: make placeholder readable
const placeholderCss = `
input::placeholder { color: rgba(255,255,255,0.55); }
`;

const buttonBase: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid var(--fff-border)",
  padding: "12px 12px",
  fontWeight: 900,
};

const buttonPrimary: React.CSSProperties = {
  background: "var(--fff-accent)",
  color: "#0B3323",
  border: "none",
};

const buttonSecondary: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
};

// inject placeholder style once
if (typeof document !== "undefined" && !document.getElementById("fff-placeholder-style")) {
  const style = document.createElement("style");
  style.id = "fff-placeholder-style";
  style.textContent = placeholderCss;
  document.head.appendChild(style);
}
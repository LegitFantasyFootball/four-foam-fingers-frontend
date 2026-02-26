import { useState } from "react";
import { useNavigate } from "react-router-dom";

type JoinLeagueResponse = {
  league_id: number;
  tournament_id: number;
  user_id: number;

  already_joined: boolean;
  already_member?: boolean;
  is_player?: boolean;
  role?: string;

  players_joined?: number;
  joined_count: number; // backward compatible from backend
  members_total?: number;

  user_count_target: number;
  status: string;
};

export default function PlayerJoinPage() {
  const navigate = useNavigate();

  const [leagueCode, setLeagueCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<JoinLeagueResponse | null>(null);

  const canSubmit = leagueCode.trim().length > 0;
  const resultSubtext = result ? renderResultSubtext(result) : null;
  
  async function handleJoin() {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(buildApiUrl("/player/leagues/join"), {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ league_code: leagueCode.trim() }),
      });

      const data = (await safeJson(res)) as JoinLeagueResponse | { detail?: unknown };

      if (!res.ok) {
        const detail =
          typeof (data as { detail?: unknown })?.detail === "string"
            ? (data as { detail?: string }).detail
            : `Join failed (${res.status})`;
        throw new Error(detail);
      }

      setResult(data as JoinLeagueResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Join failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const playersJoined = result?.players_joined ?? result?.joined_count ?? 0;

  function renderResultTitle(r: JoinLeagueResponse): string {
    if (r.already_joined) return "Already Joined";
    if (r.already_member && r.is_player) return "Joined as Player";
    return "Joined League";
  }

  function renderResultSubtext(r: JoinLeagueResponse): string | null {
    if (r.already_joined) {
      return r.role ? `You are already in this league as ${r.role}.` : "You are already in this league.";
    }
    if (r.already_member && r.is_player) {
      return r.role && r.role !== "player"
        ? `You were already a ${r.role} and are now also counted as a player.`
        : null;
    }
    return null;
  }

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 12 }}>
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24 }}>Join League</h1>
              <p style={{ marginTop: 8, marginBottom: 0, color: "var(--fff-muted)" }}>
                Enter your invite code to join a Four Foam Fingers league.
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
          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Invite Code</span>
              <input
                value={leagueCode}
                onChange={(e) => setLeagueCode(e.target.value)}
                placeholder="Enter code (MVP: league ID)"
                style={inputStyle}
              />
            </label>

            {error && <ErrorBox title="Join failed" message={error} />}

            <button
              disabled={!canSubmit || isSubmitting}
              onClick={handleJoin}
              style={{
                ...buttonBase,
                ...buttonPrimary,
                opacity: !canSubmit || isSubmitting ? 0.6 : 1,
                cursor: !canSubmit || isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Joining..." : "Join League"}
            </button>
          </div>
        </SectionCard>

        {result && (
          <SectionCard>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>{renderResultTitle(result)}</div>

            {resultSubtext && (
            <div style={{ color: "var(--fff-muted)", marginBottom: 10 }}>
                {resultSubtext}
            </div>
            )}

            <div style={{ display: "grid", gap: 6 }}>
              <div>
                League ID: <strong>{result.league_id}</strong>
              </div>
              <div>
                Tournament ID: <strong>{result.tournament_id}</strong>
              </div>
              {result.role && (
                <div>
                  Your Role: <strong>{result.role}</strong>
                </div>
              )}
              <div>
                Players Joined: <strong>{playersJoined}</strong> / <strong>{result.user_count_target}</strong>
              </div>
              {typeof result.members_total === "number" && (
                <div>
                  Members Total: <strong>{result.members_total}</strong>
                </div>
              )}
              <div>
                Status: <strong>{result.status}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button
                onClick={() =>
                  navigate(
                    `/march-basketball-foam-fingers/league/${result.league_id}/tournament/${result.tournament_id}/leaderboard`
                  )
                }
                style={{ ...buttonBase, ...buttonPrimary }}
              >
                Open Leaderboard
              </button>
                <button
                onClick={() =>
                    navigate(`/march-basketball-foam-fingers/player/league/${result.league_id}/my-teams`)
                }
                style={{ ...buttonBase, ...buttonSecondary }}
                >
                My Teams
                </button>
              <button
                onClick={() =>
                navigate(
                    `/march-basketball-foam-fingers/league/${result.league_id}/tournament/${result.tournament_id}/live-bracket`
                )
                }
                style={{ ...buttonBase, ...buttonSecondary }}
              >
                Live Bracket
              </button>
            </div>
          </SectionCard>
        )}
      </div>
    </main>
  );
}

function buildApiUrl(path: string): string {
  const base = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "";
  return `${base}${path}`;
}

function buildHeaders(): HeadersInit {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env ?? {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const accessToken = env.VITE_ACCESS_TOKEN;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (env.VITE_FFF_TEST_USER_ID) {
    headers["X-Test-User-Id"] = env.VITE_FFF_TEST_USER_ID;
  }

  return headers;
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
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

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--fff-muted)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--fff-border)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
  borderRadius: 10,
  padding: "10px 12px",
};

const buttonBase: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--fff-border)",
  padding: "10px 12px",
  fontWeight: 700,
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
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type LeagueSummary = {
  league_id: number;
  tournament_id: number;
  commissioner_user_id: number;
  league_name: string;
  user_count: number;
  joined_player_count: number;
  status: string;
  is_full: boolean;
};

export default function CommissionerLeaguePage() {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();

  const leagueIdNum = Number(leagueId);
  const hasValidLeagueId = Number.isInteger(leagueIdNum) && leagueIdNum > 0;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [league, setLeague] = useState<LeagueSummary | null>(null);

  const progressText = useMemo(() => {
    if (!league) return "";
    return `${league.joined_player_count} / ${league.user_count} players joined`;
  }, [league]);

  async function loadLeague() {
    if (!hasValidLeagueId) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(buildApiUrl(`/commissioner/leagues/${leagueIdNum}`), {
        headers: buildHeaders(),
      });

      const data = (await safeJson(res)) as LeagueSummary | { detail?: unknown };

      if (!res.ok) {
        const detail =
          typeof (data as { detail?: unknown })?.detail === "string"
            ? (data as { detail?: string }).detail
            : `Load league failed (${res.status})`;
        throw new Error(detail);
      }

      setLeague(data as LeagueSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load league failed");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadLeague();
  }, [leagueIdNum]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 820, margin: "0 auto", display: "grid", gap: 12 }}>
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 24, margin: 0 }}>Commissioner League</h1>
              <p style={{ color: "var(--fff-muted)", marginTop: 8, marginBottom: 0 }}>
                Manage invites, player fill status, assignments, and leaderboard.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/march-basketball-foam-fingers/commissioner")}
                style={{ ...buttonBase, ...buttonSecondary }}
              >
                Home
              </button>
              <button
                onClick={() => void loadLeague()}
                style={{ ...buttonBase, ...buttonSecondary }}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </SectionCard>

        {!hasValidLeagueId && (
          <SectionCard>
            <ErrorBox title="Invalid league ID" message="URL must include a valid positive league ID." />
          </SectionCard>
        )}

        {error && (
          <SectionCard>
            <ErrorBox title="Load failed" message={error} />
          </SectionCard>
        )}

        {hasValidLeagueId && (
          <SectionCard>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>League Summary</div>

            {league ? (
              <div style={{ display: "grid", gap: 8 }}>
                <div>League ID: <strong>{league.league_id}</strong></div>
                <div>League Name: <strong>{league.league_name}</strong></div>
                <div>Tournament ID: <strong>{league.tournament_id}</strong></div>
                <div>Status: <strong>{league.status}</strong></div>
                <div>{progressText}</div>

                <div
                  style={{
                    marginTop: 4,
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    border: "1px solid var(--fff-border)",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.round((league.joined_player_count / Math.max(1, league.user_count)) * 100))}%`,
                      height: "100%",
                      background: "var(--fff-accent)",
                    }}
                  />
                </div>

                <div style={{ color: "var(--fff-muted)", fontSize: 13 }}>
                  {league.is_full
                    ? "League is full. You can generate assignments now."
                    : "League must reach player target before assignments can be generated."}
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--fff-muted)" }}>{isLoading ? "Loading..." : "No league data loaded yet."}</div>
            )}
          </SectionCard>
        )}

        {hasValidLeagueId && (
          <SectionCard>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Actions</div>
            <div style={{ display: "grid", gap: 10 }}>
              <button
                onClick={() => navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueIdNum}/invites`)}
                style={{ ...buttonBase, ...buttonPrimary }}
              >
                Invite Players
              </button>

              <button
                onClick={() => navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueIdNum}/assignments`)}
                style={{ ...buttonBase, ...buttonSecondary }}
              >
                Generate Assignments
              </button>

              {league && (
                <button
                  onClick={() =>
                    navigate(
                      `/march-basketball-foam-fingers/league/${league.league_id}/tournament/${league.tournament_id}/leaderboard`
                    )
                  }
                  style={{ ...buttonBase, ...buttonSecondary }}
                >
                  Open Leaderboard
                </button>
              )}
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
  const headers: Record<string, string> = {};

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
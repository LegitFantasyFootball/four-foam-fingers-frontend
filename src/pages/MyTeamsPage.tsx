import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

type MyTeam = {
  team_id: number;
  team_name: string;
  seed: number | null;
  region: string | null;
  tier: number | null;
  slot_in_tier: number | null;
  rank_1_to_64: number | null;
};

type MyTeamsResponse = {
  league_id: number;
  tournament_id: number;
  user_id: number;
  team_count: number;
  seed_sum: number;
  seed_avg: number | null;
  teams: MyTeam[];
};

export default function MyTeamsPage() {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<MyTeamsResponse | null>(null);

  const leagueIdNum = Number(leagueId);
  const hasValidLeagueId = Number.isInteger(leagueIdNum) && leagueIdNum > 0;

  const groupedByTier = useMemo(() => {
    const out = new Map<number, MyTeam[]>();
    if (!data) return out;

    for (const team of data.teams) {
      const tier = typeof team.tier === "number" ? team.tier : 999;
      const arr = out.get(tier) ?? [];
      arr.push(team);
      out.set(tier, arr);
    }

    for (const [, arr] of out) {
      arr.sort((a, b) => {
        const tierA = a.tier ?? 999;
        const tierB = b.tier ?? 999;
        if (tierA !== tierB) return tierA - tierB;

        const slotA = a.slot_in_tier ?? 999;
        const slotB = b.slot_in_tier ?? 999;
        if (slotA !== slotB) return slotA - slotB;

        const rankA = a.rank_1_to_64 ?? 999;
        const rankB = b.rank_1_to_64 ?? 999;
        if (rankA !== rankB) return rankA - rankB;

        return a.team_id - b.team_id;
      });
    }

    return out;
  }, [data]);

  async function loadMyTeams() {
    if (!hasValidLeagueId || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(buildApiUrl(`/player/leagues/${leagueIdNum}/my-teams`), {
        method: "GET",
        headers: buildHeaders(),
      });

      const json = (await safeJson(res)) as MyTeamsResponse | { detail?: unknown };

      if (!res.ok) {
        const detail =
          typeof (json as { detail?: unknown })?.detail === "string"
            ? (json as { detail?: string }).detail
            : `Load my teams failed (${res.status})`;
        throw new Error(detail);
      }

      setData(json as MyTeamsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load my teams failed");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (hasValidLeagueId) {
      void loadMyTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidLeagueId, leagueIdNum]);

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 12 }}>
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24 }}>My Teams</h1>
              <p style={{ marginTop: 8, marginBottom: 0, color: "var(--fff-muted)" }}>
                View your assigned teams for this league.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/march-basketball-foam-fingers/lets-go")}
                style={{ ...buttonBase, ...buttonSecondary }}
              >
                Back
              </button>

                {hasValidLeagueId && (
                <button
                    onClick={() => {
                    if (!data?.tournament_id) return;
                    navigate(
                        `/march-basketball-foam-fingers/league/${leagueIdNum}/tournament/${data.tournament_id}/leaderboard`
                    );
                    }}
                    disabled={!data?.tournament_id}
                    style={{
                    ...buttonBase,
                    ...buttonPrimary,
                    opacity: data?.tournament_id ? 1 : 0.6,
                    cursor: data?.tournament_id ? "pointer" : "not-allowed",
                    }}
                    title={data?.tournament_id ? undefined : "Load teams first"}
                >
                    Open Leaderboard
                </button>
                )}

              <button
                onClick={loadMyTeams}
                disabled={!hasValidLeagueId || isLoading}
                style={{
                  ...buttonBase,
                  ...buttonSecondary,
                  opacity: !hasValidLeagueId || isLoading ? 0.6 : 1,
                  cursor: !hasValidLeagueId || isLoading ? "not-allowed" : "pointer",
                }}
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

        {data && (
          <>
            <SectionCard>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Summary</div>
              <div style={{ display: "grid", gap: 6 }}>
                <div>League ID: <strong>{data.league_id}</strong></div>
                <div>Tournament ID: <strong>{data.tournament_id}</strong></div>
                <div>User ID: <strong>{data.user_id}</strong></div>
                <div>Teams Assigned: <strong>{data.team_count}</strong></div>
                <div>Seed Sum: <strong>{data.seed_sum}</strong></div>
                <div>Seed Avg: <strong>{data.seed_avg ?? "-"}</strong></div>
              </div>
            </SectionCard>

            {[...groupedByTier.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([tier, teams]) => (
                <SectionCard key={tier}>
                  <div style={{ fontWeight: 800, marginBottom: 10 }}>
                    Tier {tier} ({teams.length} teams)
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {teams.map((team) => (
                      <div key={team.team_id} style={rowStyle}>
                        <div style={{ fontWeight: 700 }}>{team.team_name}</div>
                        <div style={metaStyle}>
                          Seed {team.seed ?? "-"} • {team.region ?? "?"} • slot {team.slot_in_tier ?? "-"} • rank{" "}
                          {team.rank_1_to_64 ?? "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              ))}
          </>
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

function SectionCard({ children }: { children: ReactNode }) {
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

const rowStyle: CSSProperties = {
  border: "1px solid var(--fff-border)",
  borderRadius: 12,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.03)",
};

const metaStyle: CSSProperties = {
  color: "var(--fff-muted)",
  fontSize: 13,
  marginTop: 4,
};

const buttonBase: CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--fff-border)",
  padding: "10px 12px",
  fontWeight: 700,
};

const buttonPrimary: CSSProperties = {
  background: "var(--fff-accent)",
  color: "#0B3323",
  border: "none",
};

const buttonSecondary: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
};
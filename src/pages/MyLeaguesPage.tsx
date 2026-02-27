import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetchJson, fetchLeaderboard } from "../lib/api";

type MyLeague = {
  league_id: number;
  tournament_id: number;
  league_name: string;
  role: string;
  is_player: boolean;
  players_joined: number;
  user_count_target: number;
  status: string;
  is_full: boolean;
};

type MyLeaguesResponse = {
  user_id: number;
  league_count: number;
  leagues: MyLeague[];
};

export default function MyLeaguesPage() {
  const navigate = useNavigate();
  const [leagueRanks, setLeagueRanks] = useState<Record<number, number | null>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<MyLeaguesResponse | null>(null);

  async function loadMyLeagues() {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const json = await apiFetchJson<MyLeaguesResponse>("/player/leagues/mine", { method: "GET" });
      setData(json);
      void loadLeagueRanks(json.leagues, json.user_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load my leagues failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLeagueRanks(leagues: MyLeague[], userId: number) {
    const initial: Record<number, number | null> = {};
    for (const l of leagues) initial[l.league_id] = null;
    setLeagueRanks(initial);

    try {
      const results = await Promise.all(
        leagues.map(async (l) => {
          const data = await fetchLeaderboard({
            leagueId: l.league_id,
            tournamentId: l.tournament_id,
            ttlSec: 30,
          });

          const me = (data.rows ?? []).find((r: any) => r.user_id === userId);
          return [l.league_id, typeof me?.rank === "number" ? me.rank : null] as const;
        })
      );

      const next: Record<number, number | null> = {};
      for (const [leagueId, rank] of results) next[leagueId] = rank;
      setLeagueRanks(next);
    } catch {
      // keep ranks as null
    }
  }

  useEffect(() => {
    void loadMyLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leagues = useMemo(() => {
    const list = data?.leagues ?? [];
    return [...list].sort((a, b) => {
      if (a.is_full !== b.is_full) return a.is_full ? -1 : 1;
      const an = (a.league_name || "").toLowerCase();
      const bn = (b.league_name || "").toLowerCase();
      return an.localeCompare(bn);
    });
  }, [data]);

  return (
    <main style={{ minHeight: "100vh", padding: 12 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", display: "grid", gap: 10 }}>
        {error && (
          <SectionCard>
            <ErrorBox title="Could not load leagues" message={error} />
          </SectionCard>
        )}

        {!data && !error && (
          <SectionCard>
            <div style={{ color: "var(--fff-muted)" }}>{isLoading ? "Loading..." : "No data yet."}</div>
          </SectionCard>
        )}

        {data && leagues.length === 0 && (
          <SectionCard>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>No leagues yet</div>
            <div style={{ color: "var(--fff-muted)", fontSize: 13 }}>Join a league to see it here.</div>
          </SectionCard>
        )}

        {data && leagues.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {leagues.map((league) => {
              const isCommissioner = (league.role || "").toLowerCase() === "commissioner";

              return (
                <div key={league.league_id} style={leagueCard}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 16, minWidth: 0 }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {league.league_name?.trim() || "League"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {isCommissioner && <Pill tone="accent">Commissioner</Pill>}
                        <Pill tone={league.is_full ? "accent" : "default"}>{league.is_full ? "Full" : "Open"}</Pill>
                      </div>
                    </div>

                    <div style={subLine}>
                      Players {league.players_joined}/{league.user_count_target}
                    </div>

                    <div style={subLine}>Place {leagueRanks[league.league_id] ?? "-"}</div>

                    <div style={{ display: "grid", gap: 8 }}>
                      <button
                        onClick={() =>
                          navigate(`/march-basketball-foam-fingers/player/league/${league.league_id}/my-teams`)
                        }
                        style={{ ...buttonBase, ...buttonPrimary }}
                      >
                        My Teams
                      </button>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <button
                          onClick={() =>
                            navigate(
                              `/march-basketball-foam-fingers/league/${league.league_id}/tournament/${league.tournament_id}/leaderboard`
                            )
                          }
                          style={{ ...buttonBase, ...buttonSecondary }}
                        >
                          Leaderboard
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/march-basketball-foam-fingers/league/${league.league_id}/tournament/${league.tournament_id}/live-bracket`
                            )
                          }
                          style={{ ...buttonBase, ...buttonSecondary }}
                        >
                          Bracket
                        </button>
                      </div>

                      {isCommissioner && (
                        <div style={{ display: "grid", gap: 8, marginTop: 2 }}>
                          <div style={{ fontWeight: 900, fontSize: 12, color: "var(--fff-muted)" }}>
                            Commissioner tools
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <button
                              onClick={() =>
                                navigate(`/march-basketball-foam-fingers/commissioner/league/${league.league_id}`)
                              }
                              style={{ ...buttonBase, ...buttonSecondary }}
                            >
                              League Page
                            </button>

                            <button
                              onClick={() =>
                                navigate(
                                  `/march-basketball-foam-fingers/commissioner/league/${league.league_id}/invites`
                                )
                              }
                              style={{ ...buttonBase, ...buttonSecondary }}
                            >
                              Invites
                            </button>
                          </div>

                          <button
                            disabled={!league.is_full}
                            onClick={() =>
                              navigate(
                                `/march-basketball-foam-fingers/commissioner/league/${league.league_id}/assignments`
                              )
                            }
                            style={{
                              ...buttonBase,
                              ...(league.is_full ? buttonPrimary : buttonSecondary),
                              opacity: league.is_full ? 1 : 0.55,
                              cursor: league.is_full ? "pointer" : "not-allowed",
                            }}
                            title={league.is_full ? "" : "League must be full first"}
                          >
                            Deal Assignments
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
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
      <div style={{ color: "var(--fff-muted)", fontSize: 14, whiteSpace: "pre-wrap" }}>{message}</div>
    </div>
  );
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "accent" }) {
  return (
    <span
      style={{
        fontSize: 11,
        borderRadius: 999,
        padding: "3px 8px",
        border: "1px solid rgba(255,255,255,0.10)",
        background: tone === "accent" ? "rgba(255,255,255,0.08)" : "transparent",
        color: tone === "accent" ? "inherit" : "var(--fff-muted)",
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

const leagueCard: CSSProperties = {
  border: "1px solid var(--fff-border)",
  borderRadius: 16,
  padding: 14,
  background: "rgba(255,255,255,0.03)",
};

const subLine: CSSProperties = {
  color: "var(--fff-muted)",
  fontSize: 13,
};

const buttonBase: CSSProperties = {
  borderRadius: 14,
  border: "1px solid var(--fff-border)",
  padding: "12px 12px",
  fontWeight: 900,
};

const buttonPrimary: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
  border: "1px solid var(--fff-border)",
};

const buttonSecondary: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
  border: "1px solid var(--fff-border)",
};
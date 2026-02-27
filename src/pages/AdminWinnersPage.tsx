//src/pages/AdminWinnersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchAdminGames,
  fetchAudit,
  setWinner,
  undoWinner,
  type AdminGame,
  type AuditItem,
} from "../lib/api";


export default function AdminWinnersPage() {
    const navigate = useNavigate();
    const { leagueId, tournamentId } = useParams<{
    leagueId: string;
    tournamentId: string;
    }>();
    const leagueIdNum = Number(leagueId);
    const tournamentIdNum = Number(tournamentId);
    const hasValidParams =
        Number.isInteger(leagueIdNum) &&
        Number.isInteger(tournamentIdNum) &&
        leagueIdNum > 0 &&
        tournamentIdNum > 0;
  const [games, setGames] = useState<AdminGame[]>([]);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);

  const [gamesLoading, setGamesLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [gamesError, setGamesError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actingGameId, setActingGameId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  function groupGamesByRound(list: AdminGame[]) {
    const sorted = [...list].sort((a, b) => {
      if (a.round_no !== b.round_no) return a.round_no - b.round_no;

      const aResolved = a.winner_team_id !== null;
      const bResolved = b.winner_team_id !== null;

      if (aResolved !== bResolved) return aResolved ? 1 : -1; // open first
      return a.game_index - b.game_index;
    });

    const map = new Map<number, AdminGame[]>();
    for (const game of sorted) {
      const arr = map.get(game.round_no) ?? [];
      arr.push(game);
      map.set(game.round_no, arr);
    }
    return map;
  }

  const groupedGames = useMemo(() => groupGamesByRound(games), [games]);

  const unresolvedTotal = useMemo(
    () => games.filter((g) => g.winner_team_id == null).length,
    [games]
  );

  async function loadGames() {
    if (!hasValidParams) {
        setGamesError("Invalid route params: leagueId/tournamentId");
        setGamesLoading(false);
        return;
        }
    try {
      setGamesError(null);
      setGamesLoading(true);

      const data = await fetchAdminGames({
        leagueId: leagueIdNum,
        tournamentId: tournamentIdNum,
        limit: 200,
        offset: 0,
      });

      setGames(data.items ?? []);
    } catch (err) {
      setGamesError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGamesLoading(false);
    }
  }

async function loadAudit() {
  if (!hasValidParams) {
    setAuditError("Invalid route params: leagueId/tournamentId");
    setAuditLoading(false);
    return;
  }
    try {
      setAuditError(null);
      setAuditLoading(true);

      const data = await fetchAudit({
        leagueId: leagueIdNum,
        tournamentId: tournamentIdNum,
        limit: 10,
        offset: 0,
      });

      setAuditItems(data.items ?? []);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAuditLoading(false);
    }
  }

  async function refreshAll() {
    try {
      setRefreshing(true);
      await Promise.all([loadGames(), loadAudit()]);
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSetWinner(game: AdminGame, winnerTeamId: number) {
   if (!hasValidParams) {
        setActionError("Invalid route params: leagueId/tournamentId");
        return;
        }
    try {
      setActionError(null);
      setActionMessage(null);
      setActingGameId(game.id);

      const res = await setWinner({
        gameId: game.id,
        winnerTeamId,
        leagueId: leagueIdNum,
        expectedVersion: game.version,
      });

      setActionMessage(
        `Set success • game ${res.game_id} • winner=${res.winner_team_id} • version=${res.version}`
      );

      await Promise.all([loadGames(), loadAudit()]);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActingGameId(null);
    }
  }

  async function handleUndoWinner(game: AdminGame) {
    if (!hasValidParams) {
        setActionError("Invalid route params: leagueId/tournamentId");
        return;
        }
    try {
      setActionError(null);
      setActionMessage(null);
      setActingGameId(game.id);

      const res = await undoWinner({
        gameId: game.id,
        leagueId: leagueIdNum,
        expectedVersion: game.version,
      });

      setActionMessage(
        `Undo success • game ${res.game_id} • winner=${String(
          res.winner_team_id
        )} • version=${res.version}`
      );

      await Promise.all([loadGames(), loadAudit()]);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActingGameId(null);
    }
  }

    useEffect(() => {
    if (!hasValidParams) return;
    Promise.all([loadGames(), loadAudit()]).then(() => {
        setLastUpdated(new Date().toLocaleTimeString());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leagueId, tournamentId, hasValidParams]);

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {/* Top controls */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/march-basketball-foam-fingers/admin")}>Back</button>
            <button
            disabled={!hasValidParams}
            onClick={() =>
                navigate(
                `/march-basketball-foam-fingers/league/${leagueIdNum}/tournament/${tournamentIdNum}/leaderboard`
                )
            }
            style={{
                border: "1px solid var(--fff-border)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--fff-text)",
                fontWeight: 600,
            }}
            >
            Leaderboard Page
          </button>
          <button
            onClick={refreshAll}
            disabled={refreshing || gamesLoading || auditLoading}
            style={{
              background: "var(--fff-accent)",
              color: "#0B3323",
              border: "none",
              fontWeight: 700,
            }}
          >
            {refreshing || gamesLoading || auditLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => navigate("/march-basketball-foam-fingers/admin/tournament-field-setup")}
            style={{
                border: "1px solid var(--fff-border)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--fff-text)",
                fontWeight: 600,
            }}
            >
            Tournament Team Setup
            </button>
        </div>

        {/* Header */}
        <SectionCard>
          <h1 style={{ fontSize: 24, margin: 0 }}>Admin Winners Console</h1>
          <p style={{ color: "var(--fff-muted)", marginTop: 8, marginBottom: 0 }}>
            {hasValidParams
            ? `League ${leagueIdNum} • Tournament ${tournamentIdNum}`
            : "Invalid route params"}
            {lastUpdated ? ` • Updated ${lastUpdated}` : ""}
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <Pill label={`Games ${games.length}`} />
            <Pill label={`Open ${unresolvedTotal}`} />
            <Pill label={`Resolved ${Math.max(games.length - unresolvedTotal, 0)}`} />
          </div>
            </SectionCard>

            {!hasValidParams && (
            <ErrorBox
                title="Invalid URL"
                message="Expected /league/:leagueId/tournament/:tournamentId/admin-winners"
            />
            )}

            {/* Action status */}
            <SectionTitle title="Winner Controls" subtitle="Official result entry for bracket progression" />
        {actionMessage && <SuccessBox message={actionMessage} />}
        {actionError && <ErrorBox title="Action failed" message={actionError} />}

        {/* Games list */}
        {gamesLoading && games.length === 0 && <MutedLine>Loading games...</MutedLine>}
        {gamesError && <ErrorBox title="Could not load games" message={gamesError} />}

        {!gamesError && games.length > 0 && (
          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
            {Array.from(groupedGames.entries()).map(([roundNo, roundGames]) => {
              const unresolvedCount = roundGames.filter((g) => g.winner_team_id == null).length;
              const totalCount = roundGames.length;

              return (
                <div
                  key={roundNo}
                  style={{
                    border: "1px solid var(--fff-border)",
                    borderRadius: 14,
                    padding: 12,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>Round {roundNo}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--fff-muted)",
                        border: "1px solid var(--fff-border)",
                        borderRadius: 999,
                        padding: "2px 8px",
                      }}
                    >
                      Open {unresolvedCount} / {totalCount}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {roundGames.map((game) => {
                      const isActing = actingGameId === game.id;
                      const isResolved = game.winner_team_id != null;

                      return (
                        <div
                          key={game.id}
                          style={{
                            background: isResolved
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(48,242,78,0.03)",
                            border: "1px solid var(--fff-border)",
                            borderRadius: 14,
                            padding: 12,
                            opacity: isActing ? 0.75 : 1,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              alignItems: "center",
                              marginBottom: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>
                              Game {game.id} • #{game.game_index}
                            </div>

                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <Pill label={isResolved ? "Resolved" : "Open"} />
                              <Pill label={`v${game.version}`} />
                              {game.region ? <Pill label={game.region} /> : null}
                            </div>
                          </div>

                          <div style={{ display: "grid", gap: 8 }}>
                            <button
                              disabled={isActing || !game.team_a_id}
                              onClick={() => game.team_a_id && handleSetWinner(game, game.team_a_id)}
                              style={winnerButtonStyle(game.winner_team_id === game.team_a_id)}
                            >
                              {game.team_a_name ?? "TBD"}{" "}
                              {game.team_a_seed ? `(Seed ${game.team_a_seed})` : ""}
                              {game.team_a_owner_display_name ? ` • ${game.team_a_owner_display_name}` : ""}
                              {game.winner_team_id === game.team_a_id ? " • WINNER" : ""}
                            </button>

                            <button
                              disabled={isActing || !game.team_b_id}
                              onClick={() => game.team_b_id && handleSetWinner(game, game.team_b_id)}
                              style={winnerButtonStyle(game.winner_team_id === game.team_b_id)}
                            >
                              {game.team_b_name ?? "TBD"}{" "}
                              {game.team_b_seed ? `(Seed ${game.team_b_seed})` : ""}
                              {game.team_b_owner_display_name ? ` • ${game.team_b_owner_display_name}` : ""}
                              {game.winner_team_id === game.team_b_id ? " • WINNER" : ""}
                            </button>

                            <button
                              disabled={isActing}
                              onClick={() => handleUndoWinner(game)}
                              style={{
                                border: "1px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.04)",
                                color: "var(--fff-text)",
                                fontWeight: 600,
                              }}
                            >
                              Undo Winner
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Audit */}
        <SectionTitle title="Recent Admin Audit" subtitle="Newest changes first" />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={loadAudit}
            disabled={auditLoading}
            style={{
              border: "1px solid var(--fff-border)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--fff-text)",
            }}
          >
            {auditLoading ? "Refreshing audit..." : "Refresh Audit"}
          </button>
        </div>

        {auditLoading && auditItems.length === 0 && <MutedLine>Loading audit...</MutedLine>}
        {auditError && <ErrorBox title="Could not load audit" message={auditError} />}

        {!auditError && auditItems.length > 0 && (
          <div style={{ display: "grid", gap: 10, marginTop: 12, marginBottom: 40 }}>
            {auditItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--fff-border)",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 700 }}>{item.action}</div>
                <div style={{ color: "var(--fff-muted)", fontSize: 13, marginTop: 4 }}>
                  {new Date(item.created_at).toLocaleString()}
                </div>
                <div style={{ color: "var(--fff-muted)", fontSize: 13, marginTop: 4 }}>
                  game {item.entity_id} • actor {item.actor_user_id}
                </div>

                {item.after_json && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: "var(--fff-muted)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    after: {JSON.stringify(item.after_json)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function winnerButtonStyle(isWinner: boolean): React.CSSProperties {
  if (isWinner) {
    return {
      background: "var(--fff-accent)",
      color: "#0B3323",
      border: "none",
      fontWeight: 800,
    };
  }

  return {
    border: "1px solid var(--fff-border)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--fff-text)",
    fontWeight: 600,
  };
}

function Pill({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: "var(--fff-muted)",
        border: "1px solid var(--fff-border)",
        borderRadius: 999,
        padding: "2px 8px",
      }}
    >
      {label}
    </div>
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

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
      {subtitle ? (
        <div style={{ color: "var(--fff-muted)", fontSize: 13, marginTop: 2 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function MutedLine({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: 12, color: "var(--fff-muted)" }}>{children}</div>;
}

function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <div
      style={{
        marginTop: 12,
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        padding: 12,
        background: "rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "var(--fff-muted)", fontSize: 14, whiteSpace: "pre-wrap" }}>
        {message}
      </div>
    </div>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div
      style={{
        marginTop: 12,
        border: "1px solid rgba(48,242,78,0.35)",
        borderRadius: 12,
        padding: 12,
        background: "rgba(48,242,78,0.08)",
        color: "var(--fff-text)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Success</div>
      <div style={{ color: "var(--fff-muted)", fontSize: 14 }}>{message}</div>
    </div>
  );
}
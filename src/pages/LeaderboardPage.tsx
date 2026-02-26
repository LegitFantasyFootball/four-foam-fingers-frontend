// src/pages/LeaderboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchLeaderboard, type LeaderboardRow } from "../lib/api";

export default function LeaderboardPage() {
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

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function loadLeaderboard(isRefresh = false) {
    if (!hasValidParams) {
      setError("Invalid route params: leagueId/tournamentId");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await fetchLeaderboard({
        leagueId: leagueIdNum,
        tournamentId: tournamentIdNum,
        ttlSec: 30,
      });

      setRows(data.rows ?? []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!hasValidParams) return;
    void loadLeaderboard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId, tournamentId, hasValidParams]);

  const empty = useMemo(
    () => !loading && !error && rows.length === 0,
    [loading, error, rows]
  );

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <button onClick={() => navigate(-1)}>Back</button>

          <button
            onClick={() => loadLeaderboard(true)}
            disabled={refreshing || !hasValidParams}
            style={{
              background: "var(--fff-accent)",
              color: "#0B3323",
              border: "none",
              fontWeight: 700,
            }}
          >
            {refreshing ? "Refreshing..." : "Refresh Leaderboard"}
          </button>

          <button
            disabled={!hasValidParams}
            onClick={() =>
              navigate(
                `/march-basketball-foam-fingers/league/${leagueIdNum}/tournament/${tournamentIdNum}/admin-winners`
              )
            }
            style={{
              border: "1px solid var(--fff-border)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--fff-text)",
              fontWeight: 600,
            }}
          >
            Admin Winners Page
          </button>
        </div>

        <SectionCard>
          <h1 style={{ fontSize: 24, margin: 0 }}>Leaderboard</h1>
          <p style={{ color: "var(--fff-muted)", marginTop: 8, marginBottom: 0 }}>
            {hasValidParams
              ? `League ${leagueIdNum} • Tournament ${tournamentIdNum}`
              : "Invalid route params"}
            {lastUpdated ? ` • Updated ${lastUpdated}` : ""}
          </p>
        </SectionCard>

        <SectionTitle title="Standings" subtitle="Live league leaderboard" />

        {!hasValidParams && (
          <ErrorBox
            title="Invalid URL"
            message="Expected /league/:leagueId/tournament/:tournamentId/leaderboard"
          />
        )}

        {loading && hasValidParams && <MutedLine>Loading leaderboard...</MutedLine>}
        {error && <ErrorBox title="Could not load leaderboard" message={error} />}
        {empty && <MutedLine>No leaderboard rows yet.</MutedLine>}

        {!loading && !error && rows.length > 0 && (
          <div style={{ display: "grid", gap: 10, marginTop: 12, marginBottom: 40 }}>
            {rows.map((row) => (
              <div
                key={row.user_id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--fff-border)",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Rank #{row.rank}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--fff-muted)",
                      border: "1px solid var(--fff-border)",
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    {row.display_name ? row.display_name : `User ${row.user_id}`}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                  }}
                >
                  <Stat label="Points" value={row.points} />
                  <Stat label="Wins" value={row.team_wins} />
                  <Stat label="Alive" value={row.teams_alive} />
                </div>
              </div>
            ))}
          </div>
        )}
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: 10,
        background: "rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--fff-muted)" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}
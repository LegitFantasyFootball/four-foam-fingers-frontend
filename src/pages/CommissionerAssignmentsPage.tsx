//src/pages/CommissionerAssignmentsPage.tsx
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetchJson } from "../lib/api";

type GenerateAssignmentsResponse = {
  league_id: number;
  assignments_created: number;
};

type AssignmentTeam = {
  team_id: number;
  team_name: string;
  seed: number | null;
  region: string | null;
  tier: number | null;
  slot_in_tier: number | null;
  rank_1_to_64: number | null;
};

type AssignmentUser = {
  user_id: number;
  teams: AssignmentTeam[];
};

type LeagueAssignmentsResponse = {
  league_id: number;
  tournament_id: number;
  assignment_count: number;
  users: AssignmentUser[];
};

export default function CommissionerAssignmentsPage() {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();

  const [seed, setSeed] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  const [result, setResult] = useState<GenerateAssignmentsResponse | null>(null);
  const [assignmentsData, setAssignmentsData] = useState<LeagueAssignmentsResponse | null>(null);
  const [error, setError] = useState("");

  const leagueIdNum = Number(leagueId);
  const hasValidLeagueId = Number.isInteger(leagueIdNum) && leagueIdNum > 0;

  const seedNum = Number(seed);
  const includeSeed = seed.trim().length > 0 && Number.isInteger(seedNum);

  const requestPath = useMemo(() => {
    if (!hasValidLeagueId) return "";
    const qs = new URLSearchParams();
    if (includeSeed) qs.set("seed", String(seedNum));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return `/commissioner/leagues/${leagueIdNum}/generate-assignments${suffix}`;
  }, [hasValidLeagueId, leagueIdNum, includeSeed, seedNum]);

  const assignmentsPath = useMemo(() => {
    if (!hasValidLeagueId) return "";
    return `/commissioner/leagues/${leagueIdNum}/assignments`;
  }, [hasValidLeagueId, leagueIdNum]);

  const fairnessRows = useMemo(() => {
    if (!assignmentsData) return [];

    return assignmentsData.users.map((u) => {
      const seeds = u.teams
        .map((t) => t.seed)
        .filter((s): s is number => typeof s === "number");

      const seedSum = seeds.reduce((acc, n) => acc + n, 0);
      const seedAvg = seeds.length ? seedSum / seeds.length : 0;

      return {
        user_id: u.user_id,
        team_count: u.teams.length,
        seed_sum: seedSum,
        seed_avg: seedAvg,
      };
    });
  }, [assignmentsData]);

  const fairnessSummary = useMemo(() => {
    if (!fairnessRows.length) return null;

    let minAvg = fairnessRows[0].seed_avg;
    let maxAvg = fairnessRows[0].seed_avg;

    for (const row of fairnessRows) {
      if (row.seed_avg < minAvg) minAvg = row.seed_avg;
      if (row.seed_avg > maxAvg) maxAvg = row.seed_avg;
    }

    return {
      min_seed_avg: minAvg,
      max_seed_avg: maxAvg,
      spread: maxAvg - minAvg,
    };
  }, [fairnessRows]);

  async function loadAssignments() {
    if (!hasValidLeagueId || isLoadingAssignments) return;

    setIsLoadingAssignments(true);
    setError("");

    try {
      if (!assignmentsPath) throw new Error("Missing assignments path");

      const data = await apiFetchJson<LeagueAssignmentsResponse>(assignmentsPath, {
        method: "GET",
      });

      setAssignmentsData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load assignments failed");
    } finally {
      setIsLoadingAssignments(false);
    }
  }

  async function handleGenerate() {
    if (!hasValidLeagueId || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setResult(null);

    try {
      if (!requestPath) throw new Error("Missing generate path");

      const data = await apiFetchJson<GenerateAssignmentsResponse>(requestPath, {
        method: "POST",
      });

      setResult(data);

      // Auto-refresh assignments after successful generation
      await loadAssignments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate assignments failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 12 }}>
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24 }}>League Assignments</h1>
              <p style={{ marginTop: 8, marginBottom: 0, color: "var(--fff-muted)" }}>
                Generate randomized balanced assignments and inspect who got which teams.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/march-basketball-foam-fingers/commissioner")}
                style={{ ...buttonBase, ...buttonSecondary }}
              >
                Commissioner Home
              </button>

              {hasValidLeagueId && (
                <>
                  <button
                    onClick={() =>
                      navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueIdNum}`)
                    }
                    style={{ ...buttonBase, ...buttonSecondary }}
                  >
                    League Page
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueIdNum}/invites`)
                    }
                    style={{ ...buttonBase, ...buttonSecondary }}
                  >
                    Invites
                  </button>
                </>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Context</div>

          {!hasValidLeagueId ? (
            <ErrorBox title="Invalid league ID" message="URL must include a valid positive league ID." />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                League ID: <strong>{leagueIdNum}</strong>
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "var(--fff-muted)" }}>Optional Seed (integer)</span>
                <input
                  inputMode="numeric"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value.replace(/[^\d-]/g, ""))}
                  placeholder="123"
                  style={inputStyle}
                />
              </label>

              <div style={{ color: "var(--fff-muted)", fontSize: 13 }}>
                Generate requires the league to be full and commissioner access. Then load assignments to inspect fairness.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={handleGenerate}
                  disabled={isSubmitting}
                  style={{
                    ...buttonBase,
                    ...buttonPrimary,
                    opacity: isSubmitting ? 0.6 : 1,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Generating..." : "Generate Assignments"}
                </button>

                <button
                  onClick={loadAssignments}
                  disabled={isLoadingAssignments}
                  style={{
                    ...buttonBase,
                    ...buttonSecondary,
                    opacity: isLoadingAssignments ? 0.6 : 1,
                    cursor: isLoadingAssignments ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoadingAssignments ? "Loading..." : "Load Assignments"}
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {error && (
          <SectionCard>
            <ErrorBox title="Assignments error" message={error} />
          </SectionCard>
        )}

        {result && (
          <SectionCard>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Generate Success</div>
            <div style={{ display: "grid", gap: 6 }}>
              <div>
                League ID: <strong>{result.league_id}</strong>
              </div>
              <div>
                Assignments Created: <strong>{result.assignments_created}</strong>
              </div>
            </div>

            {hasValidLeagueId && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button
                  onClick={() =>
                    navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueIdNum}`)
                  }
                  style={{ ...buttonBase, ...buttonSecondary }}
                >
                  Back to League Page
                </button>

              <button
                onClick={() => {
                  const tournamentId = assignmentsData?.tournament_id;
                  if (!tournamentId) return;
                  navigate(
                    `/march-basketball-foam-fingers/league/${leagueIdNum}/tournament/${tournamentId}/leaderboard`
                  );
                }}
                disabled={!assignmentsData?.tournament_id}
                style={{
                  ...buttonBase,
                  ...buttonPrimary,
                  opacity: assignmentsData?.tournament_id ? 1 : 0.6,
                  cursor: assignmentsData?.tournament_id ? "pointer" : "not-allowed",
                }}
                title={
                  assignmentsData?.tournament_id
                    ? `Open leaderboard for tournament ${assignmentsData.tournament_id}`
                    : "Load assignments first"
                }
              >
                Open Leaderboard
              </button>
              </div>
            )}
          </SectionCard>
        )}

        {assignmentsData && (
          <>
            <SectionCard>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Assignments Summary</div>
              <div style={{ display: "grid", gap: 6 }}>
                <div>League ID: <strong>{assignmentsData.league_id}</strong></div>
                <div>Tournament ID: <strong>{assignmentsData.tournament_id}</strong></div>
                <div>Total Assignments: <strong>{assignmentsData.assignment_count}</strong></div>
                <div>Users: <strong>{assignmentsData.users.length}</strong></div>
              </div>

              {fairnessSummary && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid var(--fff-border)", background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Fairness Snapshot (seed-based)</div>
                  <div style={{ display: "grid", gap: 4, color: "var(--fff-muted)", fontSize: 14 }}>
                    <div>Min Seed Avg: <strong style={{ color: "var(--fff-text)" }}>{fairnessSummary.min_seed_avg.toFixed(2)}</strong></div>
                    <div>Max Seed Avg: <strong style={{ color: "var(--fff-text)" }}>{fairnessSummary.max_seed_avg.toFixed(2)}</strong></div>
                    <div>Spread: <strong style={{ color: "var(--fff-text)" }}>{fairnessSummary.spread.toFixed(2)}</strong></div>
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Per User Fairness</div>
              <div style={{ display: "grid", gap: 8 }}>
                {fairnessRows
                  .slice()
                  .sort((a, b) => a.user_id - b.user_id)
                  .map((row) => (
                    <div key={row.user_id} style={rowStyle}>
                      <div style={{ fontWeight: 700 }}>User {row.user_id}</div>
                      <div style={metaStyle}>
                        Teams: {row.team_count} • Seed Sum: {row.seed_sum} • Seed Avg: {row.seed_avg.toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            </SectionCard>

            {assignmentsData.users
              .slice()
              .sort((a, b) => a.user_id - b.user_id)
              .map((user) => (
                <SectionCard key={user.user_id}>
                  <div style={{ fontWeight: 800, marginBottom: 10 }}>
                    User {user.user_id} ({user.teams.length} teams)
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {user.teams
                      .slice()
                      .sort((a, b) => {
                        const tierA = a.tier ?? 999;
                        const tierB = b.tier ?? 999;
                        if (tierA !== tierB) return tierA - tierB;

                        const slotA = a.slot_in_tier ?? 999;
                        const slotB = b.slot_in_tier ?? 999;
                        if (slotA !== slotB) return slotA - slotB;

                        const rankA = a.rank_1_to_64 ?? 999;
                        const rankB = b.rank_1_to_64 ?? 999;
                        return rankA - rankB;
                      })
                      .map((team) => (
                        <div key={`${user.user_id}-${team.team_id}`} style={rowStyle}>
                          <div style={{ fontWeight: 700 }}>{team.team_name}</div>
                          <div style={metaStyle}>
                            Seed {team.seed ?? "-"} • {team.region ?? "?"} • Tier {team.tier ?? "-"} • Slot {team.slot_in_tier ?? "-"} • Rank {team.rank_1_to_64 ?? "-"}
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

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--fff-border)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
  borderRadius: 10,
  padding: "10px 12px",
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
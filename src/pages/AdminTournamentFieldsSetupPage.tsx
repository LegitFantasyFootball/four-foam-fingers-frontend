
import React, { useEffect, useMemo, useState } from "react";

/**
 * AdminTournamentFieldSetupPage
 *
 * Phone-first admin page to build the tournament team list (64 teams).
 *
 * Endpoints expected:
 *  - GET    /admin/college-programs?search=&active_only=true&limit=50&offset=0
 *  - GET    /admin/tournaments/{tournamentId}/teams
 *  - PUT    /admin/tournaments/{tournamentId}/teams
 *
 * Replace apiRequest() implementation if your app already has one.
 */

/* =========================
   Types
========================= */

type Region = "South" | "West" | "East" | "Midwest";

type CollegeProgram = {
  id: number;
  name: string;
  display_name?: string | null;
  short_name?: string | null;
  slug: string;
  active: boolean;
};

type TournamentTeamApiItem = {
  id: number;
  tournament_id: number;
  college_program_id: number | null;
  team_name: string;
  region: Region;
  seed: number;
  tier: number;
  rank_1_to_64: number;
  college_program?: CollegeProgram | null;
};

type GetTournamentTeamsResponse = {
  ok: boolean;
  tournament_id: number;
  count: number;
  items: TournamentTeamApiItem[];
};

type GetCollegeProgramsResponse = {
  items: CollegeProgram[];
  limit: number;
  offset: number;
};

type UpsertPayloadItem = {
  college_program_id: number;
  region: Region;
  seed: number;
  rank_1_to_64: number;
};

type UpsertResponse = {
  ok: boolean;
  tournament_id: number;
  created: number;
  updated: number;
  count: number;
  items: TournamentTeamApiItem[];
};

type TeamRow = {
  localId: string;
  college_program_id: number | null;
  college_program_name: string;
  region: Region;
  seed: number;
  rank_1_to_64: number;
};

/* =========================
   Config
========================= */

const REGIONS: Region[] = ["South", "West", "East", "Midwest"];

const REGION_SEED_SLOTS: Array<{ region: Region; seed: number }> = (() => {
  const slots: Array<{ region: Region; seed: number }> = [];
  for (const region of REGIONS) {
    for (let seed = 1; seed <= 16; seed++) {
      slots.push({ region, seed });
    }
  }
  return slots;
})();

/* =========================
   API helper (replace if needed)
========================= */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const base = "http://127.0.0.1:8000";

  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": "1001", // dev bypass header
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      else detail = JSON.stringify(data);
    } catch {}
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

/* =========================
   Utils
========================= */

function makeLocalId() {
  return Math.random().toString(36).slice(2, 10);
}

function getTierFromRank(rank: number): number {
  return Math.floor((rank - 1) / 16) + 1;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeSearchText(p: CollegeProgram): string {
  return [
    p.name,
    p.display_name ?? "",
    p.short_name ?? "",
    p.slug,
  ]
    .join(" ")
    .toLowerCase();
}

/* =========================
   Component
========================= */

export default function AdminTournamentFieldSetupPage() {
  // If you already have route params, replace this with useParams()
  const [tournamentIdInput, setTournamentIdInput] = useState<string>("202601");
  const tournamentId = Number(tournamentIdInput) || 0;

  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [programSearch, setProgramSearch] = useState<string>("");
  const [programResults, setProgramResults] = useState<CollegeProgram[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const [selectedRowLocalId, setSelectedRowLocalId] = useState<string | null>(null);

  // local filter for quick UI search over loaded rows
  const [rowFilter, setRowFilter] = useState<string>("");


  const isWide = typeof window !== "undefined" ? window.innerWidth >= 900 : false;
  const isNarrow = typeof window !== "undefined" ? window.innerWidth < 480 : false;

  /* -------------------------
     Load existing tournament teams
  ------------------------- */
  async function loadTournamentTeams() {
    if (!tournamentId) {
      setError("Enter a valid tournament ID");
      return;
    }
    setError("");
    setMessage("");
    setLoadingTeams(true);
    try {
      const data = await apiRequest<GetTournamentTeamsResponse>(`/admin/tournaments/${tournamentId}/teams`);
      const mapped: TeamRow[] = data.items.map((t) => ({
        localId: makeLocalId(),
        college_program_id: t.college_program_id,
        college_program_name:
          t.college_program?.short_name ||
          t.college_program?.name ||
          t.team_name ||
          "",
        region: t.region,
        seed: t.seed,
        rank_1_to_64: t.rank_1_to_64,
      }));
      setRows(mapped);
      setMessage(`Loaded ${mapped.length} team rows`);
    } catch (e: any) {
      setError(e?.message || "Failed to load tournament teams");
    } finally {
      setLoadingTeams(false);
    }
  }

  /* -------------------------
     Search college programs (server)
  ------------------------- */
  async function searchCollegePrograms(searchText: string) {
    setLoadingPrograms(true);
    setError("");
    try {
      const q = new URLSearchParams({
        search: searchText,
        active_only: "true",
        limit: "200",
        offset: "0",
      });
      const data = await apiRequest<GetCollegeProgramsResponse>(`/admin/college-programs?${q.toString()}`);
      setProgramResults(data.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to search college programs");
    } finally {
      setLoadingPrograms(false);
    }
  }

  useEffect(() => {
    // optional initial search
    void searchCollegePrograms("");
  }, []);

  /* -------------------------
     Row editing helpers
  ------------------------- */
  function addBlankRow() {
    const nextRank = rows.length > 0 ? clamp(Math.max(...rows.map((r) => r.rank_1_to_64)) + 1, 1, 64) : 1;
    setRows((prev) => [
      ...prev,
      {
        localId: makeLocalId(),
        college_program_id: null,
        college_program_name: "",
        region: "South",
        seed: 1,
        rank_1_to_64: nextRank,
      },
    ]);
  }

  function removeRow(localId: string) {
    setRows((prev) => prev.filter((r) => r.localId !== localId));
    if (selectedRowLocalId === localId) setSelectedRowLocalId(null);
  }

  function updateRow(localId: string, patch: Partial<TeamRow>) {
    setRows((prev) => prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)));
  }

  function setRowProgram(localId: string, program: CollegeProgram) {
    updateRow(localId, {
      college_program_id: program.id,
      college_program_name: program.short_name || program.name,
    });
  }

  function addProgramAsRow(program: CollegeProgram) {
    // prevent duplicates locally
    if (rows.some((r) => r.college_program_id === program.id)) {
      setError(`${program.name} already added`);
      return;
    }

    // first open slot by region/seed (simple default)
    const usedSlots = new Set(rows.map((r) => `${r.region}:${r.seed}`));
    const firstOpen = REGION_SEED_SLOTS.find((s) => !usedSlots.has(`${s.region}:${s.seed}`)) || { region: "South" as Region, seed: 1 };
    const usedRanks = new Set(rows.map((r) => r.rank_1_to_64));
    let nextRank = 1;
    while (usedRanks.has(nextRank) && nextRank <= 64) nextRank += 1;
    nextRank = clamp(nextRank, 1, 64);

    setRows((prev) => [
      ...prev,
      {
        localId: makeLocalId(),
        college_program_id: program.id,
        college_program_name: program.short_name || program.name,
        region: firstOpen.region,
        seed: firstOpen.seed,
        rank_1_to_64: nextRank,
      },
    ]);
    setError("");
  }

  /* -------------------------
     Validation (client-side)
  ------------------------- */
  const validation = useMemo(() => {
    const issues: string[] = [];

    const programIds = rows.map((r) => r.college_program_id).filter((v): v is number => typeof v === "number");
    const rsKeys = rows.map((r) => `${r.region}:${r.seed}`);
    const rankKeys = rows.map((r) => r.rank_1_to_64);

    // counts
    if (rows.length > 64) issues.push(`Too many rows: ${rows.length}/64`);

    // missing fields
    rows.forEach((r, idx) => {
      if (!r.college_program_id) issues.push(`Row ${idx + 1}: missing college program`);
      if (r.seed < 1 || r.seed > 16) issues.push(`Row ${idx + 1}: invalid seed ${r.seed}`);
      if (r.rank_1_to_64 < 1 || r.rank_1_to_64 > 64) issues.push(`Row ${idx + 1}: invalid rank ${r.rank_1_to_64}`);
    });

    // duplicates
    const dupPrograms = findDuplicates(programIds);
    const dupSlots = findDuplicates(rsKeys);
    const dupRanks = findDuplicates(rankKeys);

    if (dupPrograms.length) issues.push(`Duplicate college_program_id(s): ${dupPrograms.join(", ")}`);
    if (dupSlots.length) issues.push(`Duplicate region/seed(s): ${dupSlots.join(", ")}`);
    if (dupRanks.length) issues.push(`Duplicate rank(s): ${dupRanks.join(", ")}`);

    // quick coverage stats
    const filled = rows.filter((r) => !!r.college_program_id).length;

    return {
      ok: issues.length === 0,
      issues,
      totalRows: rows.length,
      filledRows: filled,
    };
  }, [rows]);

  function findDuplicates<T extends string | number>(arr: T[]): T[] {
    const counts = new Map<T, number>();
    for (const x of arr) counts.set(x, (counts.get(x) || 0) + 1);
    return [...counts.entries()].filter(([, c]) => c > 1).map(([k]) => k);
  }

  /* -------------------------
     Save
  ------------------------- */
  async function saveTeams() {
    if (!tournamentId) {
      setError("Enter a valid tournament ID");
      return;
    }

    setError("");
    setMessage("");

    // strict local validation before request
    if (!validation.ok) {
      setError(`Fix validation issues first (${validation.issues.length})`);
      return;
    }

    const payload: { teams: UpsertPayloadItem[] } = {
      teams: rows.map((r) => ({
        college_program_id: r.college_program_id as number,
        region: r.region,
        seed: r.seed,
        rank_1_to_64: r.rank_1_to_64,
      })),
    };

    setSaving(true);
    try {
      const res = await apiRequest<UpsertResponse>(`/admin/tournaments/${tournamentId}/teams`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setMessage(`Saved. Created ${res.created}, updated ${res.updated}, total ${res.count}`);
      // reload from server so UI reflects canonical state
      await loadTournamentTeams();
    } catch (e: any) {
      setError(e?.message || "Failed to save teams");
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------
     Bulk helpers
  ------------------------- */
  function clearAllRows() {
    setRows([]);
    setSelectedRowLocalId(null);
    setMessage("");
    setError("");
  }

  function sortRows() {
    setRows((prev) =>
      [...prev].sort((a, b) => {
        if (a.rank_1_to_64 !== b.rank_1_to_64) return a.rank_1_to_64 - b.rank_1_to_64;
        if (a.region !== b.region) return a.region.localeCompare(b.region);
        return a.seed - b.seed;
      })
    );
  }

  function autoRankBySeedWithinRegion() {
    // helper only, can be replaced later with committee-like ranking input
    const regionOrder: Record<Region, number> = { South: 0, West: 1, East: 2, Midwest: 3 };
    setRows((prev) => {
      const sorted = [...prev].sort((a, b) => {
        if (regionOrder[a.region] !== regionOrder[b.region]) return regionOrder[a.region] - regionOrder[b.region];
        return a.seed - b.seed;
      });
      return sorted.map((r, i) => ({ ...r, rank_1_to_64: i + 1 }));
    });
  }

  const filteredRows = useMemo(() => {
    const q = rowFilter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.college_program_name,
        r.region,
        String(r.seed),
        String(r.rank_1_to_64),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, rowFilter]);



  const availableProgramResults = useMemo(() => {
    const selectedIds = new Set(
      rows
        .map((r) => r.college_program_id)
        .filter((id): id is number => typeof id === "number")
    );

    return programResults.filter((p) => !selectedIds.has(p.id));
  }, [programResults, rows]);
  /* -------------------------
     Render
  ------------------------- */
  return (
    <div style={styles.page} data-fff-admin-page="1">
      <style>{`
        select, option, input, textarea {
          color: #111827 !important;
          background: #ffffff !important;
        }

        /* force text inside your admin page cards */
        [data-fff-admin-page="1"] * {
          color: inherit;
        }
      `}</style>
      <div style={styles.headerCard}>
        <h1 style={styles.h1}>Admin Tournament Teams</h1>
        <p style={styles.subtle}>
          Build the 64 tournament teams from the college program catalog, then save to the tournament.
        </p>

        <div style={styles.rowWrap}>
          <label style={styles.labelBlock}>
            <span style={styles.label}>Tournament ID</span>
            <input
              value={tournamentIdInput}
              onChange={(e) => setTournamentIdInput(e.target.value)}
              inputMode="numeric"
              style={styles.input}
              placeholder="202601"
            />
          </label>

          <button style={styles.button} onClick={loadTournamentTeams} disabled={loadingTeams || !tournamentId}>
            {loadingTeams ? "Loading..." : "Load Teams"}
          </button>

          <button style={styles.buttonSecondary} onClick={saveTeams} disabled={saving || rows.length === 0}>
            {saving ? "Saving..." : "Save Teams"}
          </button>
        </div>

        <div style={styles.rowWrap}>
          <button style={styles.buttonSecondary} onClick={addBlankRow}>Add Blank Row</button>
          <button style={styles.buttonSecondary} onClick={sortRows} disabled={rows.length === 0}>Sort Rows</button>
          <button style={styles.buttonSecondary} onClick={autoRankBySeedWithinRegion} disabled={rows.length === 0}>
            Auto Rank Helper
          </button>
          <button style={styles.buttonDanger} onClick={clearAllRows} disabled={rows.length === 0}>Clear All</button>
        </div>

        <div style={styles.statsRow}>
          <Badge label={`Rows: ${validation.totalRows}/64`} ok={validation.totalRows <= 64} />
          <Badge label={`Filled: ${validation.filledRows}`} ok={true} />
          <Badge label={`Validation: ${validation.ok ? "OK" : `${validation.issues.length} issue(s)`}`} ok={validation.ok} />
        </div>

        {message ? <div style={styles.successBox}>{message}</div> : null}
        {error ? <div style={styles.errorBox}>{error}</div> : null}

        {!validation.ok && validation.issues.length > 0 ? (
          <details style={styles.details}>
            <summary style={styles.summary}>Show validation issues ({validation.issues.length})</summary>
            <ul style={styles.issueList}>
              {validation.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      <div style={{ ...styles.grid, gridTemplateColumns: isWide ? "360px 1fr" : "1fr" }}>
        {/* Left: Program search */}
        <section style={styles.card}>
          <h2 style={styles.h2}>College Programs</h2>
          <div style={styles.rowWrap}>
            <input
              value={programSearch}
              onChange={(e) => setProgramSearch(e.target.value)}
              style={styles.input}
              placeholder="Search Maryland, Mizzou, Kentucky..."
            />
            <button
              style={styles.button}
              onClick={() => searchCollegePrograms(programSearch)}
              disabled={loadingPrograms}
            >
              {loadingPrograms ? "Searching..." : "Search"}
            </button>
          </div>

          <div style={styles.list}>
            {availableProgramResults.map((p) => (
              <div key={p.id} style={styles.listItem}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.itemTitle}>{p.short_name || p.name}</div>
                  <div style={styles.itemSub}>
                    {p.display_name || p.name} • #{p.id} • {p.slug}
                  </div>
                </div>

                <div style={{ ...styles.inlineButtons, flexDirection: isWide ? "row" : "column" }}>
                  <button style={styles.smallButton} onClick={() => addProgramAsRow(p)}>
                    Add
                  </button>
                  {selectedRowLocalId ? (
                    <button
                      style={styles.smallButtonSecondary}
                      onClick={() => setRowProgram(selectedRowLocalId, p)}
                    >
                      Assign to Selected
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {availableProgramResults.length === 0 && !loadingPrograms ? (
              <div style={styles.emptyText}>
                {programResults.length === 0 ? "No results" : "All shown programs already added"}
              </div>
            ) : null}
          </div>
        </section>

        {/* Right: Team rows editor */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.h2}>Tournament Teams ({rows.length})</h2>
            <input
              value={rowFilter}
              onChange={(e) => setRowFilter(e.target.value)}
              style={{ ...styles.input, maxWidth: 220 }}
              placeholder="Filter rows"
            />
          </div>

          <div style={styles.rowsList}>
            {filteredRows.map((row, idx) => {
              const selected = selectedRowLocalId === row.localId;
              const tier = getTierFromRank(row.rank_1_to_64);

              return (
                <div
                  key={row.localId}
                  style={{
                    ...styles.rowCard,
                    ...(selected ? styles.rowCardSelected : {}),
                  }}
                  onClick={() => setSelectedRowLocalId(row.localId)}
                >
                  <div style={styles.rowTop}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.itemTitle}>
                        {row.college_program_name || "(select college program)"}
                      </div>
                      <div style={styles.itemSub}>
                        {row.college_program_id ? `program #${row.college_program_id}` : "no program selected"} • tier {tier}
                      </div>
                    </div>
                    <button
                      style={styles.iconDanger}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRow(row.localId);
                      }}
                      title="Remove row"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ ...styles.formGrid, gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr 1fr" }}>
                    <label style={styles.labelBlock}>
                      <span style={styles.label}>Region</span>
                      <select
                        value={row.region}
                        onChange={(e) => updateRow(row.localId, { region: e.target.value as Region })}
                        style={styles.select}
                      >
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </label>

                    <label style={styles.labelBlock}>
                      <span style={styles.label}>Seed</span>
                      <input
                        type="number"
                        min={1}
                        max={16}
                        value={row.seed}
                        onChange={(e) =>
                          updateRow(row.localId, { seed: clamp(Number(e.target.value || 1), 1, 16) })
                        }
                        style={styles.input}
                      />
                    </label>

                    <label style={styles.labelBlock}>
                      <span style={styles.label}>Rank 1-64</span>
                      <input
                        type="number"
                        min={1}
                        max={64}
                        value={row.rank_1_to_64}
                        onChange={(e) =>
                          updateRow(row.localId, { rank_1_to_64: clamp(Number(e.target.value || 1), 1, 64) })
                        }
                        style={styles.input}
                      />
                    </label>
                  </div>

                  <div style={styles.rowMeta}>
                    <span style={styles.mono}>
                      Slot: {row.region} #{row.seed}
                    </span>
                    <span style={styles.mono}>
                      Rank: {row.rank_1_to_64}
                    </span>
                    <span style={styles.mono}>
                      Tier: {tier}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredRows.length === 0 ? (
              <div style={styles.emptyText}>
                {rows.length === 0 ? "No rows yet. Add from the college list or create a blank row." : "No rows match filter."}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================
   Tiny UI bits
========================= */

function Badge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      style={{
        ...styles.badge,
        borderColor: ok ? "#1f7a1f" : "#9b1c1c",
      }}
    >
      {label}
    </span>
  );
}

/* =========================
   Styles (phone-first)
========================= */

const BRAND = {
  bg: "#f5f7fb",
  card: "#ffffff",
  text: "#111827",      // dark readable
  subtext: "#4b5563",
  border: "#d1d5db",
  accent: "#7c3aed",    // purple-ish brand accent (change if you want)
  accentDark: "#5b21b6",
  danger: "#991b1b",
  dangerBg: "#fef2f2",
};




const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 12,
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily: "system-ui, sans-serif",
    background: BRAND.bg,
    color: BRAND.text,
    minHeight: "100vh",
  },

  headerCard: {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    background: BRAND.card,
    color: BRAND.text,
    boxShadow: "0 2px 8px rgba(17,24,39,0.04)",
  },

  card: {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    padding: 12,
    background: BRAND.card,
    color: BRAND.text,
    minWidth: 0,
    boxShadow: "0 2px 8px rgba(17,24,39,0.04)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },

  h1: {
    margin: "0 0 4px 0",
    fontSize: 20,
    lineHeight: 1.2,
    color: BRAND.text,
    fontWeight: 700,
  },

  h2: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.2,
    color: BRAND.text,
    fontWeight: 700,
  },

  subtle: {
    margin: "0 0 10px 0",
    color: BRAND.subtext,
    fontSize: 13,
  },

  rowWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "end",
    marginBottom: 8,
  },

  labelBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 100,
    flex: "1 1 120px",
  },

  label: {
    fontSize: 12,
    color: BRAND.subtext,
    fontWeight: 600,
  },

  input: {
    height: 36,
    borderRadius: 8,
    border: `1px solid ${BRAND.border}`,
    padding: "0 10px",
    fontSize: 14,
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
    color: BRAND.text,
    outline: "none",
  },

  select: {
    height: 36,
    borderRadius: 8,
    border: `1px solid ${BRAND.border}`,
    padding: "0 10px",
    fontSize: 14,
    background: "#fff",
    color: BRAND.text,
    outline: "none",
    appearance: "auto",
    WebkitAppearance: "menulist" as any,
    MozAppearance: "menulist" as any,
  },

  button: {
    height: 36,
    borderRadius: 8,
    border: `1px solid ${BRAND.accentDark}`,
    background: BRAND.accent,
    color: "#fff",
    padding: "0 12px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },

  buttonSecondary: {
    height: 36,
    borderRadius: 8,
    border: `1px solid ${BRAND.border}`,
    background: "#fff",
    color: BRAND.text,
    padding: "0 12px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },

  buttonDanger: {
    height: 36,
    borderRadius: 8,
    border: "1px solid #f3b8b8",
    background: BRAND.dangerBg,
    color: BRAND.danger,
    padding: "0 12px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },

  smallButton: {
    height: 30,
    borderRadius: 8,
    border: `1px solid ${BRAND.accentDark}`,
    background: BRAND.accent,
    color: "#fff",
    padding: "0 10px",
    cursor: "pointer",
    fontSize: 12,
    whiteSpace: "nowrap",
    fontWeight: 600,
  },

  smallButtonSecondary: {
    height: 30,
    borderRadius: 8,
    border: `1px solid ${BRAND.border}`,
    background: "#fff",
    color: BRAND.text,
    padding: "0 10px",
    cursor: "pointer",
    fontSize: 12,
    whiteSpace: "nowrap",
    fontWeight: 600,
  },

  iconDanger: {
    height: 30,
    width: 30,
    borderRadius: 8,
    border: "1px solid #f3b8b8",
    background: BRAND.dangerBg,
    color: BRAND.danger,
    cursor: "pointer",
    fontSize: 14,
    flexShrink: 0,
    fontWeight: 700,
  },

  successBox: {
    border: "1px solid #b7e0b7",
    background: "#f3fff3",
    color: "#175a17",
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    marginTop: 8,
  },

  errorBox: {
    border: "1px solid #e1b7b7",
    background: "#fff4f4",
    color: "#7a1515",
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    marginTop: 8,
    whiteSpace: "pre-wrap",
  },

  details: {
    marginTop: 8,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 8,
    padding: 8,
    background: "#fff",
  },

  summary: {
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    color: BRAND.text,
  },

  issueList: {
    margin: "8px 0 0 16px",
    padding: 0,
    fontSize: 13,
    color: BRAND.danger,
  },

  statsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },

  badge: {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    background: "#fff",
    color: BRAND.text,
    fontWeight: 600,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 520,
    overflow: "auto",
    marginTop: 8,
  },

  listItem: {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 10,
    padding: 8,
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "#fff",
    color: BRAND.text,
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  itemSub: {
    fontSize: 12,
    color: BRAND.subtext,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  inlineButtons: {
    display: "flex",
    gap: 6,
    flexDirection: "column",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },

  rowsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 700,
    overflow: "auto",
  },

  rowCard: {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 10,
    padding: 10,
    cursor: "pointer",
    background: "#fff",
    color: BRAND.text,
  },

  rowCardSelected: {
    border: `2px solid ${BRAND.accent}`,
    boxShadow: `0 0 0 2px rgba(124,58,237,0.12)`,
    background: "#faf7ff",
  },

  rowTop: {
    display: "flex",
    gap: 8,
    alignItems: "start",
    marginBottom: 8,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },

  rowMeta: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },

  mono: {
    fontSize: 12,
    color: BRAND.subtext,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },

  emptyText: {
    color: BRAND.subtext,
    fontSize: 13,
    padding: 8,
  },
};
/* =========================
   Responsive tweaks
========================= */


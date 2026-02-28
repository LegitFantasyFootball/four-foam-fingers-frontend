// src/pages/AdminConsolePage.tsx
// src/pages/AdminConsolePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetchJson } from "../lib/api";

const GAME_BASE = "/march-basketball-foam-fingers";

type Tournament = {
  id: number;
  title?: string | null;
  name?: string | null;
  season?: string | null;
  created_at?: string;
};

type ListTournamentsResponse = {
  items: Tournament[];
  limit: number;
  offset: number;
};

export default function AdminConsolePage() {
  const navigate = useNavigate();

  // List + selection (no hardcoded ids)
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [tournamentId, setTournamentId] = useState<number | "">("");

  // Search + paging
  const [search, setSearch] = useState("");
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const hasTournament = Number.isInteger(Number(tournamentId)) && Number(tournamentId) > 0;

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === Number(tournamentId)) || null,
    [tournaments, tournamentId]
  );

  async function loadTournaments(nextOffset = 0) {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({
        search: search.trim(),
        limit: String(limit),
        offset: String(nextOffset),
      });

      // Expected backend shape:
      // GET /admin/tournaments?search=&limit=50&offset=0
      const data = await apiFetchJson<ListTournamentsResponse>(`/admin/tournaments?${q.toString()}`, {
        method: "GET",
      });

      setTournaments(data.items ?? []);
      setOffset(nextOffset);

      // Auto-select first result if nothing selected
      if (!tournamentId && (data.items?.length ?? 0) > 0) {
        setTournamentId(data.items[0].id);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTournaments(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function go(path: string) {
    if (!hasTournament) return;
    const tid = Number(tournamentId);
    navigate(`${GAME_BASE}${path.replace(":tournamentId", String(tid))}`);
  }

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 12 }}>
        <SectionCard>
          <h1 style={{ fontSize: 24, margin: 0 }}>Admin Console</h1>
          <p style={{ color: "var(--fff-muted)", marginTop: 8, marginBottom: 0 }}>
            Admin-only tools. Choose a tournament, then manage the field and winners.
          </p>
        </SectionCard>

        <SectionCard>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Tournament</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
            <label style={{ display: "grid", gap: 6, flex: "1 1 320px" }}>
              <span style={{ fontSize: 13, color: "var(--fff-muted)" }}>Search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="2026, March, NCAA..."
                style={inputStyle}
              />
            </label>

            <button
              onClick={() => loadTournaments(0)}
              disabled={loading}
              style={buttonSecondary}
            >
              {loading ? "Loading..." : "Search"}
            </button>

          <button
            onClick={() => {
              const next = Math.max(offset - limit, 0);
              void loadTournaments(next);
            }}
            disabled={loading || offset === 0}
            style={buttonSecondary}
          >
            Prev
          </button>

          <button
            onClick={() => {
              const next = offset + limit;
              void loadTournaments(next);
            }}
            disabled={loading || tournaments.length < limit}
            style={buttonSecondary}
          >
            Next
          </button>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--fff-muted)" }}>Select Tournament</span>
              <select
                value={tournamentId === "" ? "" : String(tournamentId)}
                onChange={(e) => setTournamentId(e.target.value ? Number(e.target.value) : "")}
                style={selectStyle}
              >
                <option value="">Choose...</option>
                {tournaments.map((t) => {
                  const label =
                    t.title ||
                    t.name ||
                    (t.season ? `Tournament ${t.id} (${t.season})` : `Tournament ${t.id}`);
                  return (
                    <option key={t.id} value={String(t.id)}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>

            {!hasTournament && (
              <ErrorBox title="Select a tournament" message="Pick a tournament to open admin tools." />
            )}

            {hasTournament && selectedTournament && (
              <div style={{ color: "var(--fff-muted)", fontSize: 13 }}>
                Selected: <strong style={{ color: "var(--fff-text)" }}>{selectedTournament.title || selectedTournament.name || `Tournament ${selectedTournament.id}`}</strong>
              </div>
            )}

            {error ? <ErrorBox title="Could not load tournaments" message={error} /> : null}
          </div>
        </SectionCard>

        <SectionCard>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Admin Actions</div>

          <div style={{ display: "grid", gap: 10 }}>
            <button
              disabled={!hasTournament}
              onClick={() => go(`/admin/tournament-field-setup?tournament_id=:tournamentId`)}
              style={buttonSecondary}
            >
              Tournament Team Setup
            </button>

            <button
              disabled={!hasTournament}
              onClick={() => go(`/admin/admin-winners?tournament_id=:tournamentId`)}
              style={buttonPrimary}
            >
              Admin Winners Console
            </button>

            <button
              disabled={!hasTournament}
              onClick={() => go(`/admin/leaderboard?tournament_id=:tournamentId`)}
              style={buttonSecondary}
            >
              Leaderboard
            </button>

            <button
              disabled={!hasTournament}
              onClick={() => go(`/admin/live-bracket?tournament_id=:tournamentId`)}
              style={buttonSecondary}
            >
              Live Bracket
            </button>
          </div>

          <div style={{ marginTop: 10, color: "var(--fff-muted)", fontSize: 12 }}>
            Note: These routes use query params so admin tools don’t depend on league IDs.
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--fff-border)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
  borderRadius: 10,
  padding: "10px 12px",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--fff-border)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
  borderRadius: 10,
  padding: "10px 12px",
};

const buttonPrimary: React.CSSProperties = {
  background: "var(--fff-accent)",
  color: "#0B3323",
  border: "none",
  fontWeight: 800,
  padding: "10px 12px",
  borderRadius: 10,
};

const buttonSecondary: React.CSSProperties = {
  border: "1px solid var(--fff-border)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
  fontWeight: 600,
  padding: "10px 12px",
  borderRadius: 10,
};

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
      <div style={{ color: "var(--fff-muted)", fontSize: 14, whiteSpace: "pre-wrap" }}>
        {message}
      </div>
    </div>
  );
}
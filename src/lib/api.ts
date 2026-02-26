// src/lib/api.ts
export const API_BASE_URL =
  import.meta.env.VITE_FFF_API_BASE_URL || "http://127.0.0.1:8000";

// DEV ONLY local header (leave blank in prod)
export const TEST_USER_ID =
  import.meta.env.VITE_FFF_TEST_USER_ID || "";

// -----------------------------
// Types
// -----------------------------
export type LeaderboardRow = {
  user_id: number;
  points: number;
  teams_alive: number;
  team_wins: number;
  rank: number;
  // backend may add later
  display_name?: string;
};

export type LeaderboardResponse = {
  rows: LeaderboardRow[];
};

export type AdminWinnerResponse = {
  game_id: number;
  winner_team_id: number | null;
  version: number;
};

export type AdminGame = {
  id: number;
  tournament_id: number;
  round_no: number;
  game_index: number;

  team_a_id: number | null;
  team_a_name: string | null;
  team_a_seed: number | null;
  team_a_region: string | null;
  team_a_owner_user_id: number | null;
  team_a_owner_display_name: string | null;

  team_b_id: number | null;
  team_b_name: string | null;
  team_b_seed: number | null;
  team_b_region: string | null;
  team_b_owner_user_id: number | null;
  team_b_owner_display_name: string | null;

  winner_team_id: number | null;
  version: number;
  next_game_id: number | null;
  next_slot: "A" | "B" | null;
  region: string | null;
};

export type AdminGamesResponse = {
  items: AdminGame[];
  limit: number;
  offset: number;
};

export type AuditItem = {
  id: number;
  actor_user_id: number;
  tournament_id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
};

export type AuditResponse = {
  items: AuditItem[];
  limit: number;
  offset: number;
};

// -----------------------------
// Request helpers
// -----------------------------
export type RequestOptions = {
  accessToken?: string | null; // Supabase token later
  signal?: AbortSignal;
};

function buildHeaders(opts?: RequestOptions): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  // Production path (future)
  if (opts?.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  }

  // Local dev fallback
  if (!opts?.accessToken && TEST_USER_ID) {
    headers["X-Test-User-Id"] = TEST_USER_ID;
  }

  return headers;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

async function requestJson<T>(
  url: URL,
  init: RequestInit,
  fallbackError: string
): Promise<T> {
  const res = await fetch(url.toString(), {
    credentials: "include",
    ...init,
  });

  if (!res.ok) {
    const text = await readError(res, fallbackError);
    throw new Error(`${fallbackError} (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

// -----------------------------
// API calls
// -----------------------------
export async function fetchLeaderboard(
  params: {
    leagueId: number;
    tournamentId: number;
    ttlSec?: number;
  },
  opts?: RequestOptions
): Promise<LeaderboardResponse> {
  const { leagueId, tournamentId, ttlSec = 30 } = params;

  const url = new URL(`/commissioner/leagues/${leagueId}/leaderboard`, API_BASE_URL);
  url.searchParams.set("tournament_id", String(tournamentId));
  url.searchParams.set("ttl_sec", String(ttlSec));

  return requestJson<LeaderboardResponse>(
    url,
    {
      method: "GET",
      headers: buildHeaders(opts),
      signal: opts?.signal,
    },
    "Leaderboard fetch failed"
  );
}

export async function fetchAdminGames(
  params: {
    tournamentId: number;
    leagueId: number;
    limit?: number;
    offset?: number;
  },
  opts?: RequestOptions
): Promise<AdminGamesResponse> {
  const { tournamentId, leagueId, limit = 200, offset = 0 } = params;

  const url = new URL("/admin/games", API_BASE_URL);
  url.searchParams.set("tournament_id", String(tournamentId));
  url.searchParams.set("league_id", String(leagueId));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  return requestJson<AdminGamesResponse>(
    url,
    {
      method: "GET",
      headers: buildHeaders(opts),
      signal: opts?.signal,
    },
    "Admin games fetch failed"
  );
}

export async function undoWinner(
  params: {
    gameId: number;
    leagueId: number;
    expectedVersion?: number;
  },
  opts?: RequestOptions
): Promise<AdminWinnerResponse> {
  const { gameId, leagueId, expectedVersion } = params;

  const url = new URL(`/admin/games/${gameId}/undo-winner`, API_BASE_URL);
  url.searchParams.set("league_id", String(leagueId));
  if (expectedVersion !== undefined) {
    url.searchParams.set("expected_version", String(expectedVersion));
  }

  return requestJson<AdminWinnerResponse>(
    url,
    {
      method: "PATCH",
      headers: buildHeaders(opts),
      signal: opts?.signal,
    },
    "Undo winner failed"
  );
}

export async function setWinner(
  params: {
    gameId: number;
    winnerTeamId: number;
    leagueId: number;
    expectedVersion?: number;
  },
  opts?: RequestOptions
): Promise<AdminWinnerResponse> {
  const { gameId, winnerTeamId, leagueId, expectedVersion } = params;

  const url = new URL(`/admin/games/${gameId}/winner`, API_BASE_URL);
  url.searchParams.set("winner_team_id", String(winnerTeamId));
  url.searchParams.set("league_id", String(leagueId));
  if (expectedVersion !== undefined) {
    url.searchParams.set("expected_version", String(expectedVersion));
  }

  return requestJson<AdminWinnerResponse>(
    url,
    {
      method: "PATCH",
      headers: buildHeaders(opts),
      signal: opts?.signal,
    },
    "Set winner failed"
  );
}

export async function fetchAudit(
  params: {
    tournamentId: number;
    leagueId: number;
    limit?: number;
    offset?: number;
  },
  opts?: RequestOptions
): Promise<AuditResponse> {
  const { tournamentId, leagueId, limit = 10, offset = 0 } = params;

  const url = new URL("/admin/audit", API_BASE_URL);
  url.searchParams.set("tournament_id", String(tournamentId));
  url.searchParams.set("league_id", String(leagueId));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  return requestJson<AuditResponse>(
    url,
    {
      method: "GET",
      headers: buildHeaders(opts),
      signal: opts?.signal,
    },
    "Audit fetch failed"
  );
}


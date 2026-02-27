// src/lib/api.ts
import { supabase } from "./supabase";

// Base URL (required)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL");
}

// DEV ONLY local header (never use in production)
export const TEST_USER_ID = (import.meta.env.VITE_FFF_TEST_USER_ID as string) || "";

// -----------------------------
// Types
// -----------------------------
export type LeaderboardRow = {
  user_id: number;
  points: number;
  teams_alive: number;
  team_wins: number;
  rank: number;
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
  accessToken?: string | null; // optional override
  signal?: AbortSignal;
};

async function getAccessToken(opts?: RequestOptions): Promise<string> {
  if (opts?.accessToken) return opts.accessToken;

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

async function buildHeaders(opts?: RequestOptions): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = await getAccessToken(opts);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Dev-only fallback (never allow this in production builds)
  if (!token && TEST_USER_ID && import.meta.env.DEV) {
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
  fallbackError: string,
  opts?: RequestOptions
): Promise<T> {
  const authHeaders = await buildHeaders(opts);

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      ...authHeaders,
      ...(init.headers as Record<string, string> | undefined),
    },
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
  params: { leagueId: number; tournamentId: number; ttlSec?: number },
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
      headers: await buildHeaders(opts), // <-- THIS is the fix
      signal: opts?.signal,
    },
    "Leaderboard fetch failed",
    opts
  );
}

export async function fetchAdminGames(
  params: { tournamentId: number; leagueId: number; limit?: number; offset?: number },
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
    { method: "GET", signal: opts?.signal },
    "Admin games fetch failed",
    opts
  );
}

export async function undoWinner(
  params: { gameId: number; leagueId: number; expectedVersion?: number },
  opts?: RequestOptions
): Promise<AdminWinnerResponse> {
  const { gameId, leagueId, expectedVersion } = params;

  const url = new URL(`/admin/games/${gameId}/undo-winner`, API_BASE_URL);
  url.searchParams.set("league_id", String(leagueId));
  if (expectedVersion !== undefined) url.searchParams.set("expected_version", String(expectedVersion));

  return requestJson<AdminWinnerResponse>(
    url,
    { method: "PATCH", signal: opts?.signal },
    "Undo winner failed",
    opts
  );
}

export async function setWinner(
  params: { gameId: number; winnerTeamId: number; leagueId: number; expectedVersion?: number },
  opts?: RequestOptions
): Promise<AdminWinnerResponse> {
  const { gameId, winnerTeamId, leagueId, expectedVersion } = params;

  const url = new URL(`/admin/games/${gameId}/winner`, API_BASE_URL);
  url.searchParams.set("winner_team_id", String(winnerTeamId));
  url.searchParams.set("league_id", String(leagueId));
  if (expectedVersion !== undefined) url.searchParams.set("expected_version", String(expectedVersion));

  return requestJson<AdminWinnerResponse>(
    url,
    { method: "PATCH", signal: opts?.signal },
    "Set winner failed",
    opts
  );
}

export async function fetchAudit(
  params: { tournamentId: number; leagueId: number; limit?: number; offset?: number },
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
    { method: "GET", signal: opts?.signal },
    "Audit fetch failed",
    opts
  );
}

export async function apiFetchJson<T>(path: string, init: RequestInit = {}, opts?: RequestOptions): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  return requestJson<T>(url, init, `API request failed: ${path}`, opts);
}
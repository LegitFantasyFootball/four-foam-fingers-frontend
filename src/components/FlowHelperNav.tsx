//src/components/FlowHelperNav.tsx
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Props = {
  leagueId?: number | null;
  tournamentId?: number | null;
  showCommissionerTools?: boolean;
};

const GAME_BASE = "/march-basketball-foam-fingers";

const ADMIN_EMAILS = new Set(["jet@legitgamesinc.com", "todd@legitgamesinc.com"]);

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has((email || "").trim().toLowerCase());
}

export default function FlowHelperNav({ leagueId, tournamentId, showCommissionerTools = false }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setEmail(data.session?.user?.email ?? "");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!alive) return;
      setEmail(session?.user?.email ?? "");
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate(`${GAME_BASE}/login`, { replace: true });
  }

  const hasLeague = Number.isInteger(leagueId) && (leagueId ?? 0) > 0;
  const hasTournament = Number.isInteger(tournamentId) && (tournamentId ?? 0) > 0;
  const showAdmin = isAdminEmail(email);

  return (
    <div style={wrapStyle}>
      <div style={chipsWrapStyle}>
        {showAdmin && (
          <button onClick={() => navigate(`${GAME_BASE}/admin`)} style={{ ...chipButtonBase, ...chipSecondary }}>
            Admin
          </button>
        )}

        <button onClick={() => navigate(`${GAME_BASE}/lets-go`)} style={{ ...chipButtonBase, ...chipSecondary }}>
          Home
        </button>

        <button onClick={() => navigate(`${GAME_BASE}/player/my-leagues`)} style={{ ...chipButtonBase, ...chipSecondary }}>
          My Leagues
        </button>

        <button onClick={() => navigate(`${GAME_BASE}/player/join`)} style={{ ...chipButtonBase, ...chipSecondary }}>
          Join League
        </button>

        {hasLeague && hasTournament && (
          <button
            onClick={() => navigate(`${GAME_BASE}/league/${leagueId}/tournament/${tournamentId}/live-bracket`)}
            style={{ ...chipButtonBase, ...chipSecondary }}
          >
            Live Bracket
          </button>
        )}

        <button onClick={() => navigate(`${GAME_BASE}/commissioner/leagues/new`)} style={{ ...chipButtonBase, ...chipSecondary }}>
          Create League
        </button>

        {hasLeague && (
          <button
            onClick={() => navigate(`${GAME_BASE}/player/league/${leagueId}/my-teams`)}
            style={{ ...chipButtonBase, ...chipSecondary }}
          >
            My Teams
          </button>
        )}

        {hasLeague && hasTournament && (
          <button
            onClick={() => navigate(`${GAME_BASE}/league/${leagueId}/tournament/${tournamentId}/leaderboard`)}
            style={{ ...chipButtonBase, ...chipSecondary }}
          >
            Leaderboard
          </button>
        )}

        {showCommissionerTools && hasLeague && (
          <>
            <button onClick={() => navigate(`${GAME_BASE}/commissioner/league/${leagueId}`)} style={{ ...chipButtonBase, ...chipSecondary }}>
              League Page
            </button>

            <button
              onClick={() => navigate(`${GAME_BASE}/commissioner/league/${leagueId}/invites`)}
              style={{ ...chipButtonBase, ...chipSecondary }}
            >
              Invites
            </button>

            <button
              onClick={() => navigate(`${GAME_BASE}/commissioner/league/${leagueId}/assignments`)}
              style={{ ...chipButtonBase, ...chipSecondary }}
            >
              Assignments
            </button>
          </>
        )}

        {/* Auth chips */}
        {email ? (
          <>
            <span style={{ ...chipButtonBase, ...chipGhost }}>{email}</span>
            <button onClick={logout} style={{ ...chipButtonBase, ...chipPrimary }}>
              Log out
            </button>
          </>
        ) : (
          <button onClick={() => navigate(`${GAME_BASE}/login`)} style={{ ...chipButtonBase, ...chipPrimary }}>
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}

const wrapStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  borderRadius: 0,
};

const chipsWrapStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  paddingBottom: 2,
  flexWrap: "nowrap",
};

const chipButtonBase: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--fff-border)",
  padding: "8px 12px",
  fontWeight: 800,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const chipPrimary: CSSProperties = {
  background: "var(--fff-accent)",
  color: "#0B3323",
  border: "none",
};

const chipSecondary: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
};

const chipGhost: CSSProperties = {
  background: "transparent",
  color: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.15)",
};
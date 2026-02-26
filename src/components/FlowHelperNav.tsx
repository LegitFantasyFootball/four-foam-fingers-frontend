import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  leagueId?: number | null;
  tournamentId?: number | null;
  showCommissionerTools?: boolean;
};

export default function FlowHelperNav({
  leagueId,
  tournamentId,
  showCommissionerTools = false,
}: Props) {
  const navigate = useNavigate();

  const hasLeague = Number.isInteger(leagueId) && (leagueId ?? 0) > 0;
  const hasTournament = Number.isInteger(tournamentId) && (tournamentId ?? 0) > 0;

  return (
    <div style={wrapStyle}>

      <div style={chipsWrapStyle}>
        <button
        onClick={() => navigate("/march-basketball-foam-fingers/lets-go")}
        style={{ ...chipButtonBase, ...chipSecondary }}
        >
        Home
        </button>
        <button
          onClick={() => navigate("/march-basketball-foam-fingers/player/my-leagues")}
          style={{ ...chipButtonBase, ...chipSecondary }}
        >
          My Leagues
        </button>

        <button
          onClick={() => navigate("/march-basketball-foam-fingers/player/join")}
          style={{ ...chipButtonBase, ...chipSecondary }}
        >
          Join League
        </button>

        {hasLeague && hasTournament && (
        <button
            onClick={() =>
            navigate(
                `/march-basketball-foam-fingers/league/${leagueId}/tournament/${tournamentId}/live-bracket`
            )
            }
            style={{ ...chipButtonBase, ...chipSecondary }}
        >
            Live Bracket
        </button>
        )}

        <button
        onClick={() => navigate("/march-basketball-foam-fingers/commissioner/leagues/new")}
        style={{ ...chipButtonBase, ...chipSecondary }}
        >
        Create League
        </button>



        {hasLeague && (
          <button
            onClick={() =>
              navigate(`/march-basketball-foam-fingers/player/league/${leagueId}/my-teams`)
            }
            style={{ ...chipButtonBase, ...chipSecondary }}
          >
            My Teams
          </button>
        )}

        {hasLeague && hasTournament && (
          <button
            onClick={() =>
              navigate(
                `/march-basketball-foam-fingers/league/${leagueId}/tournament/${tournamentId}/leaderboard`
              )
            }
            style={{ ...chipButtonBase, ...chipSecondary }}
          >
            Leaderboard
          </button>
        )}

        {showCommissionerTools && hasLeague && (
          <>
            <button
              onClick={() =>
                navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueId}`)
              }
              style={{ ...chipButtonBase, ...chipSecondary }}
            >
              League Page
            </button>

            <button
              onClick={() =>
                navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueId}/invites`)
              }
              style={{ ...chipButtonBase, ...chipSecondary }}
            >
              Invites
            </button>

            <button
              onClick={() =>
                navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueId}/assignments`)
              }
              style={{ ...chipButtonBase, ...chipSecondary }}
            >
              Assignments
            </button>
          </>
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

const titleStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: 14,
  marginBottom: 10,
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
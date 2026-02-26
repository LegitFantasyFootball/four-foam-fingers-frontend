import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import AdminRoute from "./components/AdminRoute";
import AuthGate from "./components/AuthGate";

import HomePage from "./pages/HomePage";
import GameLobbyPage from "./pages/GameLobbyPage";
import LetsGoPage from "./pages/LetsGoPage";
import LoginPage from "./pages/LoginPage";

import CreateLeaguePage from "./pages/CreateLeaguePage";
import CommissionerLeaguePage from "./pages/CommissionerLeaguePage";
import CommissionerInvitesPage from "./pages/CommissionerInvitesPage";
import CommissionerAssignmentsPage from "./pages/CommissionerAssignmentsPage";

import PlayerJoinPage from "./pages/PlayerJoinPage";
import MyLeaguesPage from "./pages/MyLeaguesPage";
import MyTeamsPage from "./pages/MyTeamsPage";

import LeaderboardPage from "./pages/LeaderboardPage";
import LiveBracketPage from "./pages/LiveBracketPage";

import AdminConsolePage from "./pages/AdminConsolePage";
import AdminTournamentFieldsSetupPage from "./pages/AdminTournamentFieldsSetupPage";
import AdminWinnersPage from "./pages/AdminWinnersPage";

const GAME_BASE = "/march-basketball-foam-fingers";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Auth gate for the whole game */}
      <Route path={GAME_BASE} element={<AuthGate />}>
        <Route path={`${GAME_BASE}/login`} element={<LoginPage />} />

        {/* Game app routes (shared top nav / flow helper) */}
        <Route element={<AppShell />}>
          <Route path={GAME_BASE} element={<GameLobbyPage />} />
          <Route path={`${GAME_BASE}/lets-go`} element={<LetsGoPage />} />

          {/* Commissioner */}
          <Route
            path={`${GAME_BASE}/commissioner`}
            element={<Navigate to={`${GAME_BASE}/commissioner/leagues/new`} replace />}
          />
          <Route path={`${GAME_BASE}/commissioner/leagues/new`} element={<CreateLeaguePage />} />
          <Route
            path={`${GAME_BASE}/commissioner/league/:leagueId`}
            element={<CommissionerLeaguePage />}
          />
          <Route
            path={`${GAME_BASE}/commissioner/league/:leagueId/invites`}
            element={<CommissionerInvitesPage />}
          />
          <Route
            path={`${GAME_BASE}/commissioner/league/:leagueId/assignments`}
            element={<CommissionerAssignmentsPage />}
          />

          {/* Player */}
          <Route path={`${GAME_BASE}/player/join`} element={<PlayerJoinPage />} />
          <Route path={`${GAME_BASE}/player/my-leagues`} element={<MyLeaguesPage />} />
          <Route
            path={`${GAME_BASE}/player/league/:leagueId/my-teams`}
            element={<MyTeamsPage />}
          />

          {/* League + tournament scoped views */}
          <Route
            path={`${GAME_BASE}/league/:leagueId/tournament/:tournamentId/leaderboard`}
            element={<LeaderboardPage />}
          />
          <Route
            path={`${GAME_BASE}/league/:leagueId/tournament/:tournamentId/live-bracket`}
            element={<LiveBracketPage />}
          />
        </Route>

        {/* Admin routes (still behind auth, plus AdminRoute) */}
        <Route
          path={`${GAME_BASE}/admin`}
          element={
            <AdminRoute>
              <AdminConsolePage />
            </AdminRoute>
          }
        />
        <Route
          path={`${GAME_BASE}/admin/tournament-field-setup`}
          element={
            <AdminRoute>
              <AdminTournamentFieldsSetupPage />
            </AdminRoute>
          }
        />
        <Route
          path={`${GAME_BASE}/league/:leagueId/tournament/:tournamentId/admin-winners`}
          element={
            <AdminRoute>
              <AdminWinnersPage />
            </AdminRoute>
          }
        />

        <Route
          path={`${GAME_BASE}/admin/*`}
          element={<Navigate to={`${GAME_BASE}/admin`} replace />}
        />
        <Route
          path={`${GAME_BASE}/commissioner/*`}
          element={<Navigate to={`${GAME_BASE}/commissioner/leagues/new`} replace />}
        />
        <Route
          path={`${GAME_BASE}/*`}
          element={<Navigate to={`${GAME_BASE}/lets-go`} replace />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

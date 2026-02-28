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

      {/* Everything under GAME_BASE requires auth (except /login) */}
      <Route path={GAME_BASE} element={<AuthGate />}>
        <Route path="login" element={<LoginPage />} />

        {/* App shell for normal pages */}
        <Route element={<AppShell />}>
          <Route index element={<GameLobbyPage />} />
          <Route path="lets-go" element={<LetsGoPage />} />

          {/* Commissioner */}
          <Route path="commissioner" element={<Navigate to="commissioner/leagues/new" replace />} />
          <Route path="commissioner/leagues/new" element={<CreateLeaguePage />} />
          <Route path="commissioner/league/:leagueId" element={<CommissionerLeaguePage />} />
          <Route path="commissioner/league/:leagueId/invites" element={<CommissionerInvitesPage />} />
          <Route path="commissioner/league/:leagueId/assignments" element={<CommissionerAssignmentsPage />} />

          {/* Player */}
          <Route path="player/join" element={<PlayerJoinPage />} />
          <Route path="player/my-leagues" element={<MyLeaguesPage />} />
          <Route path="player/league/:leagueId/my-teams" element={<MyTeamsPage />} />

          {/* League + tournament scoped */}
          <Route path="league/:leagueId/tournament/:tournamentId/leaderboard" element={<LeaderboardPage />} />
          <Route path="league/:leagueId/tournament/:tournamentId/live-bracket" element={<LiveBracketPage />} />
        </Route>

        {/* Admin (tournament-scoped via query params) */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminConsolePage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/tournament-field-setup"
          element={
            <AdminRoute>
              <AdminTournamentFieldsSetupPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/admin-winners"
          element={
            <AdminRoute>
              <AdminWinnersPage />
            </AdminRoute>
          }
        />

        {/* Scoped fallbacks (IMPORTANT: absolute, to prevent /admin/admin/admin loops) */}
        <Route path="admin/*" element={<Navigate to={`${GAME_BASE}/admin`} replace />} />
        <Route path="commissioner/*" element={<Navigate to="commissioner/leagues/new" replace />} />
        <Route path="*" element={<Navigate to="lets-go" replace />} />
      </Route>

      {/* global fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
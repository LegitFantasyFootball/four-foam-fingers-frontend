export const fffRoutes = {
  home: "/march-basketball-foam-fingers",
  adminConsole: "/march-basketball-foam-fingers/admin",
  fieldSetup: "/march-basketball-foam-fingers/admin/tournament-field-setup",
  leaderboard: (leagueId: number, tournamentId: number) =>
    `/march-basketball-foam-fingers/league/${leagueId}/tournament/${tournamentId}/leaderboard`,
  liveBracket: (leagueId: number, tournamentId: number) =>
    `/march-basketball-foam-fingers/league/${leagueId}/tournament/${tournamentId}/live-bracket`,
  adminWinners: (leagueId: number, tournamentId: number) =>
    `/march-basketball-foam-fingers/league/${leagueId}/tournament/${tournamentId}/admin-winners`,
};
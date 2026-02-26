import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAdminGames, type AdminGame } from "../lib/api";



const REGION_ORDER = ["South", "West", "East", "Midwest"] as const;
type RegionName = (typeof REGION_ORDER)[number];

type SelectedTeamInfo = {
  teamId: number;
  teamName: string;
  seed: number | null;
  region: string | null;
  ownerUserId: number | null;
  ownerDisplayName: string | null;
};


export default function LiveBracketPage() {

  const { leagueId, tournamentId } = useParams<{ leagueId: string; tournamentId: string }>();

  const leagueIdNum = Number(leagueId);
  const tournamentIdNum = Number(tournamentId);

  const hasRouteContext =
    Number.isInteger(leagueIdNum) &&
    leagueIdNum > 0 &&
    Number.isInteger(tournamentIdNum) &&
    tournamentIdNum > 0;

  const [games, setGames] = useState<AdminGame[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Multiple regions can be open at once (your idea)
  const [openRegions, setOpenRegions] = useState<Record<RegionName, boolean>>({
    South: false,
    West: false,
    East: false,
    Midwest: false,
  });

  const [selectedTeam, setSelectedTeam] = useState<SelectedTeamInfo | null>(null);

  async function loadGames() {

  if (!hasRouteContext) {
    setError("Missing or invalid league/tournament in URL");
    setLoading(false);
    return;
  }

  try {
    setError(null);
    setLoading(true);

    const data = await fetchAdminGames({
      tournamentId: tournamentIdNum,
      leagueId: leagueIdNum,
      limit: 200,
      offset: 0,
    });

    setGames(data.items ?? []);
    setLastUpdated(new Date().toLocaleTimeString());
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    if (hasRouteContext) {
      void loadGames();
    } else {
      setLoading(false);
      setError("Missing or invalid league/tournament in URL");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRouteContext, leagueIdNum, tournamentIdNum]);

  const regionData = useMemo(() => {
    const map: Record<RegionName, AdminGame[]> = {
      South: [],
      West: [],
      East: [],
      Midwest: [],
    };

    for (const game of games) {
      for (const region of REGION_ORDER) {
        if (gameBelongsToRegion(game, region)) {
          map[region].push(game);
        }
      }
    }

    // Round grouping in backend bracket order
    for (const region of REGION_ORDER) {
      map[region] = [...map[region]].sort((a, b) => {
        if (a.round_no !== b.round_no) return a.round_no - b.round_no;

        if (a.game_index !== b.game_index) return a.game_index - b.game_index;
        return a.id - b.id;
      });
    }

    return map;
  }, [games]);


  function toggleRegion(region: RegionName) {
    setOpenRegions((prev) => ({ ...prev, [region]: !prev[region] }));
  }



  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>


        <div
          style={{
            background: "var(--fff-surface)",
            border: "1px solid var(--fff-border)",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <h1 style={{ fontSize: 24, margin: 0 }}>2026 Basketball Bracket</h1>
        <p style={{ color: "var(--fff-muted)", marginTop: 8, marginBottom: 0 }}>
          League {hasRouteContext ? leagueIdNum : "-"}
          {lastUpdated ? ` • Updated ${lastUpdated}` : ""}
        </p>
        </div>

        {loading && (
          <div style={{ marginTop: 12, color: "var(--fff-muted)" }}>
            Loading bracket...
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 12,
              background: "rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Could not load bracket</div>
            <div style={{ color: "var(--fff-muted)", fontSize: 14, whiteSpace: "pre-wrap" }}>
              {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {REGION_ORDER.map((region) => {
              const items = regionData[region];
   
              return (
                <section
                  key={region}
                  style={{
                    border: "1px solid var(--fff-border)",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.02)",
                    overflow: "hidden",
                  }}
                >
                <button
                  onClick={() => toggleRegion(region)}
                  style={{
                    width: "100%",
                    textAlign: "center",
                    background: "transparent",
                    color: "inherit",
                    border: "none",
                    padding: 14,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div style={{ width: "100%", fontWeight: 800, fontSize: 18, textAlign: "center" }}>
                    {region}
                  </div>
                </button>
                  {openRegions[region] && (
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        padding: 12,
                        background: "rgba(0,0,0,0.08)",
                      }}
                    >
                      {items.length === 0 ? (
                        <div style={{ color: "var(--fff-muted)", fontSize: 14 }}>
                          No games visible for this region yet.
                        </div>
                      ) : (
                        <RegionBracketLane
                          region={region}
                          games={items}
                          onTeamClick={setSelectedTeam}
                        />
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {selectedTeam && (
        <TeamOwnerModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}
    </main>
  );
}



function RegionBracketLane({
  region,
  games,
  onTeamClick,
}: {
  region: RegionName;
  games: AdminGame[];
  onTeamClick: (team: SelectedTeamInfo) => void;
}) {

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const round1 = [...games]
    .filter((g) => g.round_no === 1)
    .sort((a, b) => a.game_index - b.game_index);

  const round2 = [...games]
    .filter((g) => g.round_no === 2)
    .sort((a, b) => a.game_index - b.game_index);

  const round3 = [...games]
    .filter((g) => g.round_no === 3)
    .sort((a, b) => a.game_index - b.game_index);

  const round4 = [...games]
    .filter((g) => g.round_no === 4)
    .sort((a, b) => a.game_index - b.game_index);

  // Mobile-first bracket layout (more vertical, less wide)
  const layout = {
    width: 520,
    height: 690,

    titleY: 34,

    rowH: 28,
    teamStep: 38,
    topTeamsY: 82,

    xSeed: 8,
    xRound1Label: 24,
    wRound1Label: 88,

    x1: 118,
    x1Join: 138,

    x2: 172,
    x2Join: 206,

    x3: 258,
    x3Join: 292,

    x4: 344,
    x4Join: 378,

    xFF: 432,

    wR2: 64,
    wR3: 64,
    wR4: 64,
    wFF: 64,

    slotLabelXPad: -45,
    compactLabelYNudge: -13,

  } as const;

  const scale = viewportWidth > 0 ? Math.min(1, viewportWidth / layout.width) : 1;
  const scaledWidth = layout.width * scale;
  const scaledHeight = layout.height * scale;

  // NCAA-style seed order in a region
  const seedPairs: Array<[number, number]> = [
    [1, 16],
    [8, 9],
    [5, 12],
    [4, 13],
    [6, 11],
    [3, 14],
    [7, 10],
    [2, 15],
  ];

  // 16 row centers for Round of 64 entries
  const r1RowTop = Array.from({ length: 16 }, (_, i) => layout.topTeamsY + i * layout.teamStep);
  const r1CenterY = r1RowTop.map((y) => y + layout.rowH / 2);

  // Winner slot centers for later rounds (computed by midpoint, so lines always align perfectly)
  const r2CenterY = pairMidpoints(r1CenterY); // 8
  const r3CenterY = pairMidpoints(r2CenterY); // 4
  const r4CenterY = pairMidpoints(r3CenterY); // 2
  const ffCenterY = pairMidpoints(r4CenterY); // 1

  const lime = "rgba(117,255,122,0.92)";
  const limeDim = "rgba(117,255,122,0.33)";
  const limeFaint = "rgba(117,255,122,0.20)";


  const r2Display = Array.from({ length: 4 }, (_, gameIdx0) => {
    const g = getGameByIndex(round2, gameIdx0 + 1);

    const topFallback = winnerSlotFromGame(getGameByIndex(round1, gameIdx0 * 2 + 1), region);
    const botFallback = winnerSlotFromGame(getGameByIndex(round1, gameIdx0 * 2 + 2), region);

    return {
      game: g,
      top: extractSideTeamOrFallback(g, "a", topFallback, region),
      bot: extractSideTeamOrFallback(g, "b", botFallback, region),
    };
  });

  const r3Display = Array.from({ length: 2 }, (_, gameIdx0) => {
    const g = getGameByIndex(round3, gameIdx0 + 1);

    const topFallback = winnerSlotFromGame(getGameByIndex(round2, gameIdx0 * 2 + 1), region);
    const botFallback = winnerSlotFromGame(getGameByIndex(round2, gameIdx0 * 2 + 2), region);

    return {
      game: g,
      top: extractSideTeamOrFallback(g, "a", topFallback, region),
      bot: extractSideTeamOrFallback(g, "b", botFallback, region),
    };
  });

  const r4Display = (() => {
    const g = getGameByIndex(round4, 1);

    const topFallback = winnerSlotFromGame(getGameByIndex(round3, 1), region);
    const botFallback = winnerSlotFromGame(getGameByIndex(round3, 2), region);

    return {
      game: g,
      top: extractSideTeamOrFallback(g, "a", topFallback, region),
      bot: extractSideTeamOrFallback(g, "b", botFallback, region),
    };
  })();


  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => setViewportWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  function lineForGame(game: AdminGame | null): string {
    if (!game) return limeFaint;
    return game.winner_team_id != null ? lime : limeDim;
  }

  return (
    <div
      ref={viewportRef}
      style={{
        width: "100%",
        overflow: "hidden",
        paddingBottom: 4,
      }}
    >
      <div
        style={{
          position: "relative",
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: layout.width,
            height: layout.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            borderRadius: 12,
            background: "linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))",
          }}
        >
          {/* Title + close-space look like your whiteboard concept */}
          <div
            style={{
              position: "absolute",
              left: 8,
              top: 8,
              fontSize: 24,
              lineHeight: "24px",
              fontWeight: 800,
              opacity: 0.95,
            }}
          >
            {region}
          </div>

          {/* Optional tiny round labels (kept subtle so they don't clutter) */}
          <div style={tinyRoundLabel(layout.xRound1Label, 56)}>Round of 64</div>
          <div style={tinyRoundLabel(layout.x2 + 4, 74)}>Round of 32</div>
          <div style={tinyRoundLabel(layout.x3 + 4, 116)}>Sweet 16</div>
          <div style={tinyRoundLabel(layout.x4 + 4, 166)}>Elite 8</div>

          <div
            style={{
              position: "absolute",
              left: layout.xFF + 8,
              top: ffCenterY[0] - 54,
              color: "rgba(255,255,255,0.80)",
              fontWeight: 700,
              fontSize: 13,
              lineHeight: "14px",
              whiteSpace: "pre-line",
              pointerEvents: "none",
            }}
          >
            {"Final\nFour"}
          </div>

          {/* Full bracket lines in one SVG (this is the key fix) */}
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            aria-hidden
          >
            {/* Round 1 -> Round 2 */}
            {renderBracketRoundLines({
              sourceY: r1CenterY,
              targetY: r2CenterY,
              xSource: layout.x1,
              xJoin: layout.x1Join,
              xTarget: layout.x2,
              gameCount: 8,
              strokeForIndex: (i) => lineForGame(getGameByIndex(round1, i + 1)),
            })}

            {/* Round 2 -> Round 3 */}
            {renderBracketRoundLines({
              sourceY: r2CenterY,
              targetY: r3CenterY,
              xSource: layout.x2,
              xJoin: layout.x2Join,
              xTarget: layout.x3,
              gameCount: 4,
              strokeForIndex: (i) => lineForGame(getGameByIndex(round2, i + 1)),
            })}

            {/* Round 3 -> Round 4 */}
            {renderBracketRoundLines({
              sourceY: r3CenterY,
              targetY: r4CenterY,
              xSource: layout.x3,
              xJoin: layout.x3Join,
              xTarget: layout.x4,
              gameCount: 2,
              strokeForIndex: (i) => lineForGame(getGameByIndex(round3, i + 1)),
            })}

            {/* Round 4 -> Final Four */}
            {renderBracketRoundLines({
              sourceY: r4CenterY,
              targetY: ffCenterY,
              xSource: layout.x4,
              xJoin: layout.x4Join,
              xTarget: layout.xFF,
              gameCount: 1,
              strokeForIndex: () => lineForGame(getGameByIndex(round4, 1)),
            })}
          </svg>

          {/* Round 1 team labels (always visible; placeholders included) */}
          {seedPairs.map(([seedA, seedB], gameIdx0) => {
            const g = getGameByIndex(round1, gameIdx0 + 1);

            const topTeam = extractSideTeamOrPlaceholder(g, "a", seedA, region);
            const botTeam = extractSideTeamOrPlaceholder(g, "b", seedB, region);

            const aWon = !!g && g.winner_team_id != null && g.winner_team_id === g.team_a_id;
            const bWon = !!g && g.winner_team_id != null && g.winner_team_id === g.team_b_id;

            const topRowIndex = gameIdx0 * 2;
            const botRowIndex = topRowIndex + 1;

            return (
              <div key={`r1-game-${gameIdx0 + 1}`}>
                <BracketTeamLabel
                  x={layout.xSeed}
                  y={r1RowTop[topRowIndex]}
                  rowH={layout.rowH}
                  seed={topTeam.seed}
                  name={topTeam.teamName}
                  labelWidth={layout.wRound1Label}
                  won={aWon}
                  dim={topTeam.placeholder}
                  onClick={
                    topTeam.selected
                      ? () => onTeamClick(topTeam.selected!)
                      : undefined
                  }
                />
                <BracketTeamLabel
                  x={layout.xSeed}
                  y={r1RowTop[botRowIndex]}
                  rowH={layout.rowH}
                  seed={botTeam.seed}
                  name={botTeam.teamName}
                  labelWidth={layout.wRound1Label}
                  won={bWon}
                  dim={botTeam.placeholder}
                  onClick={
                    botTeam.selected
                      ? () => onTeamClick(botTeam.selected!)
                      : undefined
                  }
                />
              </div>
            );
          })}









          {/* Round of 32 participant slots (carry winners forward if round2 game isn't populated yet) */}
          {r2Display.map((slot, gameIdx0) => {
            const g = slot.game;

            const aWon = !!g && g.winner_team_id != null && g.winner_team_id === g.team_a_id;
            const bWon = !!g && g.winner_team_id != null && g.winner_team_id === g.team_b_id;

            return (
              <div key={`r2-slots-${gameIdx0}`}>
                <BracketTeamLabel
                  x={layout.x2 + layout.slotLabelXPad}
                  y={r2CenterY[gameIdx0 * 2] - layout.rowH / 2 + layout.compactLabelYNudge}
                  rowH={layout.rowH}
                  seed={slot.top.seed}
                  name={slot.top.teamName}
                  labelWidth={layout.wR2}
                  won={aWon}
                  dim={slot.top.placeholder}
                  compact
                  onClick={slot.top.selected ? () => onTeamClick(slot.top.selected!) : undefined}
                />
                <BracketTeamLabel
                  x={layout.x2 + layout.slotLabelXPad}
                  y={r2CenterY[gameIdx0 * 2 + 1] - layout.rowH / 2 + layout.compactLabelYNudge}
                  rowH={layout.rowH}
                  seed={slot.bot.seed}
                  name={slot.bot.teamName}
                  labelWidth={layout.wR2}
                  won={bWon}
                  dim={slot.bot.placeholder}
                  compact
                  onClick={slot.bot.selected ? () => onTeamClick(slot.bot.selected!) : undefined}
                />
              </div>
            );
          })}


          {/* Sweet 16 participant slots (carry winners forward if round3 game isn't populated yet) */}
          {r3Display.map((slot, gameIdx0) => {
            const g = slot.game;

            const aWon = !!g && g.winner_team_id != null && g.winner_team_id === g.team_a_id;
            const bWon = !!g && g.winner_team_id != null && g.winner_team_id === g.team_b_id;

            return (
              <div key={`r3-slots-${gameIdx0}`}>
                <BracketTeamLabel
                  x={layout.x3 + layout.slotLabelXPad}
                  y={r3CenterY[gameIdx0 * 2] - layout.rowH / 2 + layout.compactLabelYNudge}
                  rowH={layout.rowH}
                  seed={slot.top.seed}
                  name={slot.top.teamName}
                  labelWidth={layout.wR3}
                  won={aWon}
                  dim={slot.top.placeholder}
                  compact
                  onClick={slot.top.selected ? () => onTeamClick(slot.top.selected!) : undefined}
                />
                <BracketTeamLabel
                  x={layout.x3 + layout.slotLabelXPad}
                  y={r3CenterY[gameIdx0 * 2 + 1] - layout.rowH / 2 + layout.compactLabelYNudge}
                  rowH={layout.rowH}
                  seed={slot.bot.seed}
                  name={slot.bot.teamName}
                  labelWidth={layout.wR3}
                  won={bWon}
                  dim={slot.bot.placeholder}
                  compact
                  onClick={slot.bot.selected ? () => onTeamClick(slot.bot.selected!) : undefined}
                />
              </div>
            );
          })}


          {/* Elite 8 participant slots (carry winners forward if round4 game isn't populated yet) */}
          {(() => {
            const g = r4Display.game;

            const aWon = !!g && g.winner_team_id != null && g.winner_team_id === g.team_a_id;
            const bWon = !!g && g.winner_team_id != null && g.winner_team_id === g.team_b_id;

            return (
              <div key="r4-slots-0">
                <BracketTeamLabel
                  x={layout.x4 + layout.slotLabelXPad}
                  y={r4CenterY[0] - layout.rowH / 2 + layout.compactLabelYNudge}
                  rowH={layout.rowH}
                  seed={r4Display.top.seed}
                  name={r4Display.top.teamName}
                  labelWidth={layout.wR4}
                  won={aWon}
                  dim={r4Display.top.placeholder}
                  compact
                  onClick={r4Display.top.selected ? () => onTeamClick(r4Display.top.selected!) : undefined}
                />
                <BracketTeamLabel
                  x={layout.x4 + layout.slotLabelXPad}
                  y={r4CenterY[1] - layout.rowH / 2 + layout.compactLabelYNudge}
                  rowH={layout.rowH}
                  seed={r4Display.bot.seed}
                  name={r4Display.bot.teamName}
                  labelWidth={layout.wR4}
                  won={bWon}
                  dim={r4Display.bot.placeholder}
                  compact
                  onClick={r4Display.bot.selected ? () => onTeamClick(r4Display.bot.selected!) : undefined}
                />
              </div>
            );
          })()}


          {/* Final Four output (winner of Elite 8) */}
          {(() => {
            const finalFourSlot = winnerSlotFromGame(getGameByIndex(round4, 1), region);

            return (
              <BracketTeamLabel
                x={layout.xFF + layout.slotLabelXPad}
                y={ffCenterY[0] - layout.rowH / 2 + layout.compactLabelYNudge}
                rowH={layout.rowH}
                seed={finalFourSlot.seed}
                name={finalFourSlot.teamName}
                labelWidth={layout.wFF}
                won={!finalFourSlot.placeholder}
                dim={finalFourSlot.placeholder}
                compact
                onClick={finalFourSlot.selected ? () => onTeamClick(finalFourSlot.selected!) : undefined}
              />
            );
          })()}



        </div>
      </div>
    </div>
  );
}




/* ---------------- Bracket drawing helpers ---------------- */

function pairMidpoints(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i += 2) {
    out.push((values[i] + values[i + 1]) / 2);
  }
  return out;
}

function renderBracketRoundLines({
  sourceY,
  targetY,
  xSource,
  xJoin,
  xTarget,
  gameCount,
  strokeForIndex,
}: {
  sourceY: number[];
  targetY: number[];
  xSource: number;
  xJoin: number;
  xTarget: number;
  gameCount: number;
  strokeForIndex: (gameIndex0: number) => string;
}) {
  const items: React.ReactNode[] = [];

  for (let i = 0; i < gameCount; i++) {
    const y1 = sourceY[i * 2];
    const y2 = sourceY[i * 2 + 1];
    const ym = targetY[i];
    const stroke = strokeForIndex(i);

    items.push(
      <g key={`round-lines-${xSource}-${i}`}>
        {/* two short horizontals */}
        <line x1={xSource} y1={y1} x2={xJoin} y2={y1} stroke={stroke} strokeWidth={2} />
        <line x1={xSource} y1={y2} x2={xJoin} y2={y2} stroke={stroke} strokeWidth={2} />

        {/* vertical join */}
        <line x1={xJoin} y1={y1} x2={xJoin} y2={y2} stroke={stroke} strokeWidth={2} />

        {/* winner path to next round slot */}
        <line x1={xJoin} y1={ym} x2={xTarget} y2={ym} stroke={stroke} strokeWidth={2} />
      </g>
    );
  }

  return items;
}

function tinyRoundLabel(left: number, top: number): React.CSSProperties {
  return {
    position: "absolute",
    left,
    top,
    fontSize: 8,
    lineHeight: "9px",
    color: "var(--fff-muted)",
    opacity: 0.85,
    pointerEvents: "none",
    whiteSpace: "nowrap",
  };
}

function getGameByIndex(items: AdminGame[], gameIndex: number): AdminGame | null {
  // Prefer explicit game_index match; fallback to positional index if needed.
  return items.find((g) => g.game_index === gameIndex) ?? items[gameIndex - 1] ?? null;
}

/* ---------------- Team extraction helpers ---------------- */

type BracketSlotTeam = {
  seed: number | null;
  teamName: string;
  selected: SelectedTeamInfo | null;
  placeholder: boolean;
};

function placeholderBracketSlot(region: RegionName, seed: number | null = null): BracketSlotTeam {
  return {
    seed,
    teamName: "",
    selected: null,
    placeholder: true,
  };
}

function bracketSlotFromSelectedTeam(team: SelectedTeamInfo): BracketSlotTeam {
  return {
    seed: team.seed ?? null,
    teamName: team.teamName,
    selected: team,
    placeholder: false,
  };
}

function winnerSlotFromGame(game: AdminGame | null, region: RegionName): BracketSlotTeam {
  const winner = extractWinnerTeam(game);
  return winner ? bracketSlotFromSelectedTeam(winner) : placeholderBracketSlot(region, null);
}

function extractSideTeamOrFallback(
  game: AdminGame | null,
  side: "a" | "b",
  fallback: BracketSlotTeam,
  region: RegionName
): BracketSlotTeam {
  const actual = extractSideTeamOrPlaceholder(game, side, fallback.seed, region);

  // If actual side is present, use it. If not, keep winner from prior round.
  if (!actual.placeholder) return actual;
  return fallback;
}

function extractSideTeamOrPlaceholder(
  game: AdminGame | null,
  side: "a" | "b",
  fallbackSeed: number | null,
  region: RegionName
): {
  seed: number | null;
  teamName: string;
  selected: SelectedTeamInfo | null;
  placeholder: boolean;
} {
  if (!game) {
    return {
      seed: fallbackSeed,
      teamName: "",
      selected: null,
      placeholder: true,
    };
  }

  const isA = side === "a";
  const teamId = isA ? game.team_a_id : game.team_b_id;
  const teamName = isA ? game.team_a_name : game.team_b_name;
  const seed = (isA ? game.team_a_seed : game.team_b_seed) ?? fallbackSeed;
  const teamRegion = (isA ? game.team_a_region : game.team_b_region) ?? region;
  const ownerUserId = isA ? game.team_a_owner_user_id : game.team_b_owner_user_id;
  const ownerDisplayName = isA ? game.team_a_owner_display_name : game.team_b_owner_display_name;

  if (teamId == null || !teamName) {
    return {
      seed,
      teamName: "",
      selected: null,
      placeholder: true,
    };
  }

  return {
    seed,
    teamName,
    selected: {
      teamId,
      teamName,
      seed,
      region: teamRegion ?? null,
      ownerUserId: ownerUserId ?? null,
      ownerDisplayName: ownerDisplayName ?? null,
    },
    placeholder: false,
  };
}

function extractWinnerTeam(game: AdminGame | null): SelectedTeamInfo | null {
  if (!game || game.winner_team_id == null) return null;

  if (game.winner_team_id === game.team_a_id && game.team_a_id != null && game.team_a_name) {
    return {
      teamId: game.team_a_id,
      teamName: game.team_a_name,
      seed: game.team_a_seed ?? null,
      region: game.team_a_region ?? null,
      ownerUserId: game.team_a_owner_user_id ?? null,
      ownerDisplayName: game.team_a_owner_display_name ?? null,
    };
  }

  if (game.winner_team_id === game.team_b_id && game.team_b_id != null && game.team_b_name) {
    return {
      teamId: game.team_b_id,
      teamName: game.team_b_name,
      seed: game.team_b_seed ?? null,
      region: game.team_b_region ?? null,
      ownerUserId: game.team_b_owner_user_id ?? null,
      ownerDisplayName: game.team_b_owner_display_name ?? null,
    };
  }

  return null;
}

/* ---------------- Label component (no pills, stacked words) ---------------- */

function BracketTeamLabel({
  x,
  y,
  rowH,
  seed,
  name,
  labelWidth,
  won = false,
  dim = false,
  compact = false,
  onClick,
}: {
  x: number;
  y: number;
  rowH: number;
  seed: number | null;
  name: string;
  labelWidth: number;
  won?: boolean;
  dim?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  if (!name || !name.trim()) return null;


  const [line1, line2] = splitTeamNameTwoLines(name);

  const seedPrefix = seed != null ? `${seed}. ` : "";
  const firstLine = `${seedPrefix}${line1}`;

  // move right a bit so it doesn't sit on the bracket line
  const leftPad = compact ? 8 : 10;

  // we need 2 lines, so the label needs more height than rowH
  const height = compact ? rowH + 6 : rowH + 8;
  const width = labelWidth + leftPad;
  const displayName = `${seed ?? ""}${seed ? ". " : ""}${name}`;
  // tighter gap in compact mode


const inner = (
  <div
    style={{
      height,
      width,
      paddingLeft: leftPad,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      color: dim ? "rgba(255,255,255,0.72)" : "inherit",
      overflow: "hidden",
    }}
    title={seed != null ? `${seed}. ${name}` : name}
  >
    <div
      style={{
        fontSize: compact ? 9 : 10,
        lineHeight: compact ? "10px" : "11px",
        fontWeight: won ? 800 : 600,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {firstLine}
    </div>

    <div
      style={{
        fontSize: compact ? 9 : 10,
        lineHeight: compact ? "10px" : "11px",
        fontWeight: won ? 800 : 600,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        opacity: line2 ? 1 : 0,
      }}
    >
      {line2 || "\u00A0"}
    </div>
  </div>
);

  if (!onClick) {
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          height: height,
          pointerEvents: "none",
        }}
        title={name}
      >
        {inner}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: height,
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
      }}
      aria-label={seed != null ? `${seed}. ${name}` : name}
      title={displayName}
    >
      {inner}
    </button>
  );
}



function splitTeamNameTwoLines(name: string): [string, string] {
  const s = (name || "").trim();
  if (!s) return ["TBD", ""];

  const parts = s.split(/\s+/);
  if (parts.length === 1) return [parts[0], ""];
  if (parts.length === 2) return [parts[0], parts[1]];

  // 3 words: 1 + 2 reads better in narrow brackets for many team names
  // e.g. "North Carolina State" => "North" / "Carolina State"
  if (parts.length === 3) return [parts[0], parts.slice(1).join(" ")];

  // 4+ words: split roughly in half
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
}


function TeamOwnerModal({
  team,
  onClose,
}: {
  team: SelectedTeamInfo;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      role="button"
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 12,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 680,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "var(--fff-surface)",
          padding: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800 }}>Team Owner</div>
          <button onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 12,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                minWidth: 24,
                textAlign: "center",
                fontSize: 12,
                color: "var(--fff-muted)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 999,
                padding: "2px 6px",
              }}
            >
              {team.seed ?? "-"}
            </span>
            <span style={{ fontSize: 18, fontWeight: 800 }}>{team.teamName}</span>
          </div>

          <div style={{ marginTop: 8, color: "var(--fff-muted)", fontSize: 13 }}>
            {team.region ?? "Unknown region"} • Team ID {team.teamId}
          </div>

          <div
            style={{
              marginTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 12,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--fff-muted)", marginBottom: 4 }}>Owner</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {team.ownerDisplayName ?? "Unassigned"}
            </div>

            {team.ownerUserId !== null && (
              <div style={{ marginTop: 4, color: "var(--fff-muted)", fontSize: 13 }}>
                User {team.ownerUserId}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



function gameBelongsToRegion(game: AdminGame, region: RegionName): boolean {
  return (
    game.region === region ||
    game.team_a_region === region ||
    game.team_b_region === region
  );
}
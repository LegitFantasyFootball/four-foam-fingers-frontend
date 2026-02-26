import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function CommissionerInvitesPage() {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();
  const [copied, setCopied] = useState<"" | "code" | "link">("");

  const leagueIdNum = Number(leagueId);
  const hasValidLeagueId = Number.isInteger(leagueIdNum) && leagueIdNum > 0;

  const inviteCode = hasValidLeagueId ? String(leagueIdNum) : "";
  const inviteLink = useMemo(() => {
    if (!hasValidLeagueId) return "";
    const origin = window.location.origin;
    return `${origin}/march-basketball-foam-fingers/player/join?code=${encodeURIComponent(inviteCode)}`;
  }, [hasValidLeagueId, inviteCode]);

  async function copyText(value: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(""), 1200);
    } catch {
      setCopied("");
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 12 }}>
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24 }}>Invite Players</h1>
              <p style={{ marginTop: 8, marginBottom: 0, color: "var(--fff-muted)" }}>
                Share an invite code or link. MVP uses league ID as invite code.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/march-basketball-foam-fingers/commissioner")}
                style={{ ...buttonBase, ...buttonSecondary }}
              >
                Home
              </button>

              {hasValidLeagueId && (
                <button
                  onClick={() => navigate(`/march-basketball-foam-fingers/commissioner/league/${leagueIdNum}`)}
                  style={{ ...buttonBase, ...buttonSecondary }}
                >
                  League Page
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        {!hasValidLeagueId ? (
          <SectionCard>
            <ErrorBox title="Invalid league ID" message="URL must include a valid positive league ID." />
          </SectionCard>
        ) : (
          <>
            <SectionCard>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Invite Code</div>
              <div
                style={{
                  border: "1px solid var(--fff-border)",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                {inviteCode}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => void copyText(inviteCode, "code")}
                  style={{ ...buttonBase, ...buttonPrimary }}
                >
                  {copied === "code" ? "Copied Code" : "Copy Code"}
                </button>
              </div>
            </SectionCard>

            <SectionCard>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Invite Link</div>
              <div
                style={{
                  border: "1px solid var(--fff-border)",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  wordBreak: "break-word",
                }}
              >
                {inviteLink}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => void copyText(inviteLink, "link")}
                  style={{ ...buttonBase, ...buttonSecondary }}
                >
                  {copied === "link" ? "Copied Link" : "Copy Link"}
                </button>

                <button
                  onClick={() => navigate("/march-basketball-foam-fingers/player/join")}
                  style={{ ...buttonBase, ...buttonSecondary }}
                >
                  Open Join Page
                </button>
              </div>
            </SectionCard>

            <SectionCard>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Commissioner Notes</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--fff-text)" }}>
                <li>Players join with the invite code (currently the league ID).</li>
                <li>Once the league reaches 2/4/8/16 players, generate assignments.</li>
                <li>Then everyone can track leaderboard progress live.</li>
              </ul>
            </SectionCard>
          </>
        )}
      </div>
    </main>
  );
}

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
      <div style={{ color: "var(--fff-muted)", fontSize: 14 }}>{message}</div>
    </div>
  );
}

const buttonBase: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--fff-border)",
  padding: "10px 12px",
  fontWeight: 700,
};

const buttonPrimary: React.CSSProperties = {
  background: "var(--fff-accent)",
  color: "#0B3323",
  border: "none",
};

const buttonSecondary: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: "var(--fff-text)",
};
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

function getDisplayNameFromSession(session: any): string {
  const meta = session?.user?.user_metadata ?? {};
  const raw =
    meta.full_name ||
    meta.name ||
    meta.display_name ||
    session?.user?.email?.split("@")?.[0] ||
    "";
  return String(raw).trim();
}

export default function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [needsName, setNeedsName] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  const loc = useLocation();

  useEffect(() => {
    let alive = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const session = data.session;
      const ok = !!session;
      setHasSession(ok);

      if (ok) {
        const dn = getDisplayNameFromSession(session);
        if (!dn) {
          setNeedsName(true);
        }
      }

      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (!alive) return;

      const ok = !!session;
      setHasSession(ok);

      if (ok) {
        const dn = getDisplayNameFromSession(session);
        setNeedsName(!dn);
      } else {
        setNeedsName(false);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function saveDisplayName() {
    if (savingName) return;

    const trimmed = nameInput.trim();
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 40) {
      setNameError("Name must be 40 characters or less.");
      return;
    }

    setSavingName(true);
    setNameError("");

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (error) throw error;

      setNeedsName(false);
    } catch (e: any) {
      setNameError(e?.message || "Could not save name.");
    } finally {
      setSavingName(false);
    }
  }

  if (loading) return null;

  // allow login route without session
  if (loc.pathname.endsWith("/login")) return <Outlet />;

  if (!hasSession) {
    return <Navigate to="/march-basketball-foam-fingers/login" replace />;
  }

  // hard gate: must set display name once
  if (needsName) {
    return (
      <main style={{ minHeight: "100vh", padding: 16, display: "grid", placeItems: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            border: "1px solid var(--fff-border)",
            borderRadius: 16,
            padding: 16,
            background: "var(--fff-surface)",
            display: "grid",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Set your display name</div>
            <div style={{ color: "var(--fff-muted)", marginTop: 6, fontSize: 13 }}>
              This is what people will see in your league.
            </div>
          </div>

          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Todd"
            style={{
              width: "100%",
              border: "1px solid var(--fff-border)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--fff-text)",
              borderRadius: 12,
              padding: "14px 12px",
              fontSize: 16,
              outline: "none",
            }}
          />

          {nameError && (
            <div style={{ color: "rgba(255,120,120,0.95)", fontSize: 13, fontWeight: 800 }}>
              {nameError}
            </div>
          )}

          <button
            onClick={saveDisplayName}
            disabled={savingName}
            style={{
              borderRadius: 12,
              border: "none",
              padding: "12px 12px",
              fontWeight: 900,
              background: "var(--fff-accent)",
              color: "#0B3323",
              opacity: savingName ? 0.7 : 1,
              cursor: savingName ? "not-allowed" : "pointer",
            }}
          >
            {savingName ? "Saving..." : "Continue"}
          </button>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
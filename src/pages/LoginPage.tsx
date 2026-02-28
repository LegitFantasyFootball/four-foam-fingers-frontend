import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GAME_BASE = "/march-basketball-foam-fingers";

function normalizeFrom(from: unknown): string {
  const s = typeof from === "string" ? from : "";
  if (s.startsWith(GAME_BASE)) return s;
  return `${GAME_BASE}/lets-go`;
}

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();

  const from = normalizeFrom((location.state as any)?.from);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string>("");

  useEffect(() => {
    // If already signed in, bounce to intended destination
    supabase.auth.getSession().then(({ data }) => {
      const e = data.session?.user?.email ?? "";
      if (e) {
        setSignedInEmail(e);
        nav(from, { replace: true });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const e = session?.user?.email ?? "";
      if (e) {
        setSignedInEmail(e);
        nav(from, { replace: true });
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [nav, from]);

  async function submit() {
    setMsg("");
    setBusy(true);

    try {
      if (!email || !password) {
        setMsg("Email and password required.");
        return;
      }

      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMsg(error.message);
          return;
        }
        const e = data.session?.user?.email ?? "";
        setSignedInEmail(e);
        nav(from, { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMsg(error.message);
        return;
      }

      if (!data.session) {
        setMsg("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        return;
      }

      nav(from, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSignedInEmail("");
    setMsg("Signed out.");
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 420 }}>
      <h2>{mode === "signin" ? "Sign in" : "Create account"}</h2>

      {signedInEmail ? (
        <div style={{ marginBottom: 12 }}>
          Signed in as <strong>{signedInEmail}</strong>
          <button onClick={signOut} style={{ marginLeft: 10, padding: "6px 10px" }}>
            Sign out
          </button>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setMode("signin")}
          disabled={busy}
          style={{ padding: "8px 12px", opacity: mode === "signin" ? 1 : 0.6 }}
        >
          Sign in
        </button>
        <button
          onClick={() => setMode("signup")}
          disabled={busy}
          style={{ padding: "8px 12px", opacity: mode === "signup" ? 1 : 0.6 }}
        >
          Create account
        </button>
      </div>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        autoComplete="email"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        type="password"
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        style={{ padding: 10, width: "100%" }}
      />

      <button
        onClick={submit}
        disabled={busy}
        style={{ marginTop: 12, padding: "10px 12px", width: "100%" }}
      >
        {busy ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      {msg ? <div style={{ marginTop: 10, color: "#555" }}>{msg}</div> : null}
    </div>
  );
}
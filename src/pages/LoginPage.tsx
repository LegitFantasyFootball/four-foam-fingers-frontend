import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setMsg("");
    setBusy(true);

    try {
      if (!email || !password) {
        setMsg("Email and password required.");
        return;
      }

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMsg(error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMsg(error.message);
        } else {
          setMsg("Account created. You can sign in now.");
          setMode("signin");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 420 }}>
      <h2>{mode === "signin" ? "Sign in" : "Create account"}</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setMode("signin")}
          disabled={busy}
          style={{
            padding: "8px 12px",
            opacity: mode === "signin" ? 1 : 0.6,
          }}
        >
          Sign in
        </button>
        <button
          onClick={() => setMode("signup")}
          disabled={busy}
          style={{
            padding: "8px 12px",
            opacity: mode === "signup" ? 1 : 0.6,
          }}
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
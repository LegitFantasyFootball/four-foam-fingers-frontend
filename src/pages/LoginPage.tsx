import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function sendLink() {
    setMsg("Sending link...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setMsg(error ? error.message : "Check your email for the sign-in link.");
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 420 }}>
      <h2>Sign in</h2>
      <p>We’ll email you a sign-in link.</p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        style={{ padding: 10, width: "100%" }}
      />
      <button onClick={sendLink} style={{ marginTop: 10, padding: "10px 12px" }}>
        Send link
      </button>
      <div style={{ marginTop: 10, color: "#555" }}>{msg}</div>
    </div>
  );
}

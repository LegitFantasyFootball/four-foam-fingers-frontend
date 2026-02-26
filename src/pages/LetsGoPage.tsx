import { useNavigate } from "react-router-dom";

export default function LetsGoPage() {
  const navigate = useNavigate();

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          display: "grid",
          gap: 14,
          paddingTop: 24,
        }}
      >
        <SectionCard>
          <h1 style={{ fontSize: 28, margin: 0, textAlign: "center" }}>LET'S GO!</h1>
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: "var(--fff-muted)",
              textAlign: "center",
            }}
          >
            Choose your role to continue
          </p>
        </SectionCard>

     
        <button
          onClick={() => navigate("/march-basketball-foam-fingers/commissioner")}
          style={{ ...buttonBase, ...buttonPrimary, minHeight: 64, fontSize: 18 }}
        >
          Commissioner
        </button>

        <div style={{ textAlign: "center", color: "var(--fff-muted)", fontWeight: 700 }}>OR</div>

        <button
          onClick={() => navigate("/march-basketball-foam-fingers/player/join")}
          style={{ ...buttonBase, ...buttonSecondary, minHeight: 64, fontSize: 18 }}
        >
          Player
        </button>
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

const buttonBase: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--fff-border)",
  fontWeight: 800,
  cursor: "pointer",
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
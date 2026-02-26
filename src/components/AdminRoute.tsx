//src/components/AdminRoute.tsx
import { Navigate, useLocation } from "react-router-dom";

// Replace this with your real auth hook/store later
function useAuth() {
  // Example shape:
  // return { isLoading: false, isAuthenticated: true, isAdmin: true };
  return { isLoading: false, isAuthenticated: true, isAdmin: true };
}

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <main style={{ minHeight: "100vh", padding: 16 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              border: "1px solid var(--fff-border)",
              background: "var(--fff-surface)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Admin access required</h2>
            <p style={{ marginBottom: 0, color: "var(--fff-muted)" }}>
              You do not have permission to view this page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
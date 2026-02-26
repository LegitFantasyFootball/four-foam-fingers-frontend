import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setHasSession(!!data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!alive) return;
      setHasSession(!!session);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  // allow login route without session
  if (loc.pathname.endsWith("/login")) return <Outlet />;

  return hasSession ? <Outlet /> : <Navigate to="/march-basketball-foam-fingers/login" replace />;
}

import { Outlet } from "react-router-dom";
import FlowHelperNav from "./FlowHelperNav";

export default function AppShell() {
  return (
    <div>
      <div style={{ padding: 12, paddingBottom: 0 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <FlowHelperNav />
        </div>
      </div>
      <Outlet />
    </div>
  );
}
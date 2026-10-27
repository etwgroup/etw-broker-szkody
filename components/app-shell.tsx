import { AppSidebar } from "@/components/app-sidebar";
import type { AppProfile } from "@/lib/auth";

export function AppShell({ profile, children }: { profile: AppProfile; children: React.ReactNode }) {
  return <div className="app-shell"><AppSidebar profile={profile}/><main className="app-content">{children}</main></div>;
}

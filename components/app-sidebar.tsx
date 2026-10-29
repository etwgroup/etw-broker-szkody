"use client";

import { ArchiveRestore, BarChart3, Building2, ClipboardList, FileText, LayoutDashboard, LogOut, PlusCircle, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AppProfile } from "@/lib/auth";
import { NotificationsNavLink } from "@/components/notifications-nav-link";

const adminNavigation = [
  { href: "/admin", label: "Pulpit", icon: LayoutDashboard },
  { href: "/admin/communities", label: "Obsługiwane wspólnoty", icon: Building2 },
  { href: "/admin/damages/new", label: "Zgłoś szkodę", icon: PlusCircle },
];
const brokerNavigation = [
  { href: "/broker", label: "Zgłoszone szkody", icon: ClipboardList },
  { href: "/broker/damages/import", label: "Dodaj już zgłoszone szkody", icon: ArchiveRestore },
  { href: "/broker/communities", label: "Wspólnoty", icon: Building2 },
  { href: "/broker/administrators", label: "Obsługiwani Administratorzy", icon: UsersRound },
  { href: "/broker/reports", label: "Raporty", icon: BarChart3 },
];

export function AppSidebar({ profile }: { profile: AppProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = profile.role === "broker" ? brokerNavigation : adminNavigation;
  const handleSignOut = async () => {
    if (profile.isDemo) {
      await fetch("/api/demo-login", { method: "DELETE" });
      router.replace("/login"); router.refresh(); return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };
  return <aside className="sidebar">
    <Link href={profile.role === "broker" ? "/broker" : "/admin"} className="sidebar-logo" aria-label="ETW Broker — pulpit"><img src="/etw-broker-logo.png" alt="ETW Broker" /></Link>
    <nav className="nav-group">
      <p className="nav-label">{profile.role === "broker" ? "Panel brokera" : "Panel administratora"}</p>
      {nav.map(({ href, label, icon: Icon }) => {
        const isBrokerClaimDetail = href === "/broker" && pathname.startsWith("/broker/damages/") && !pathname.startsWith("/broker/damages/import");
        const active = pathname === href || (href !== "/admin" && href !== "/broker" && pathname.startsWith(href)) || isBrokerClaimDetail;
        return <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`}><Icon size={17}/><span>{label}</span></Link>;
      })}
      <NotificationsNavLink role={profile.role} demo={profile.isDemo}/>
    </nav>
    <div className="sidebar-user">
      <ShieldCheck size={15} />
      <strong>{profile.role === "broker" ? "Jessica Klimiuk-Waszczuk" : profile.full_name || "Użytkownik"}</strong>
      <span>{profile.role === "broker" ? "Broker ubezpieczeniowy" : profile.email}</span>
      <button className="signout" type="button" onClick={handleSignOut}><LogOut size={12} /> Wyloguj się</button>
      <Link href="/legal" className={`sidebar-legal-link ${pathname.startsWith("/legal") ? "active" : ""}`}><FileText size={15} /> Informacje prawne</Link>
    </div>
  </aside>;
}

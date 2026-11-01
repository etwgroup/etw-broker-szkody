import { CalendarDays, LogIn, MonitorSmartphone, Search, ShieldCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/claims";
import { demoUserLoginEvents } from "@/lib/demo-data";

type UserLoginEvent = {
  id: string;
  full_name: string;
  email: string | null;
  role: "administrator" | "broker";
  company_name: string | null;
  device_label: string | null;
  logged_in_at: string;
};

function localDay(value: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(new Date(value));
}

function roleLabel(role: UserLoginEvent["role"]) {
  return role === "broker" ? "Broker" : "Administrator";
}

export default async function BrokerUserLoginsPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; date?: string }> }) {
  const query = await searchParams;
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const { data } = isDemo
    ? { data: null }
    : await supabase!
      .from("user_login_events")
      .select("id, full_name, email, role, company_name, device_label, logged_in_at")
      .order("logged_in_at", { ascending: false })
      .limit(500);
  const items = (isDemo ? demoUserLoginEvents : data || []) as UserLoginEvent[];
  const searched = (query.q || "").trim().toLocaleLowerCase("pl");
  const selectedRole = query.role === "broker" || query.role === "administrator" ? query.role : "";
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(query.date || "") ? query.date || "" : "";
  const filtered = items.filter((item) => {
    const haystack = `${item.full_name} ${item.email || ""} ${item.company_name || ""}`.toLocaleLowerCase("pl");
    return (!searched || haystack.includes(searched))
      && (!selectedRole || item.role === selectedRole)
      && (!selectedDate || localDay(item.logged_in_at) === selectedDate);
  });
  const today = localDay(new Date().toISOString());
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const todayCount = items.filter((item) => localDay(item.logged_in_at) === today).length;
  const activeUsers = new Set(items.filter((item) => new Date(item.logged_in_at).getTime() >= weekAgo).map((item) => item.email || item.full_name)).size;
  const latest = items[0];

  return <AppShell profile={profile}>
    <header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Raport użytkowników</h1><p className="subtitle">Historia udanych logowań administratorów i brokera w Centrum obsługi szkód.</p></div></header>
    <section className="login-report-note panel"><ShieldCheck size={19}/><p><strong>Bezpieczny rejestr dostępu.</strong> Raport zapisuje użytkownika, czas wejścia i rodzaj urządzenia. Nie zapisujemy haseł ani adresów IP.</p></section>
    <section className="stats stats--three stats--login-report"><article className="stat-card"><span><LogIn size={15}/> Logowania dzisiaj</span><strong>{todayCount}</strong></article><article className="stat-card"><span><UsersRound size={15}/> Aktywni użytkownicy · 7 dni</span><strong>{activeUsers}</strong></article><article className="stat-card"><span><CalendarDays size={15}/> Ostatnie logowanie</span><strong className="login-report__latest">{latest ? formatDateTime(latest.logged_in_at) : "—"}</strong>{latest && <small>{latest.full_name}</small>}</article></section>
    <section className="panel login-report-table"><div className="panel-header"><div><h2><MonitorSmartphone size={18}/> Historia logowań</h2><p>{filtered.length} z {items.length} zdarzeń</p></div></div><form className="login-report-filters"><label className="login-report-filters__search"><Search size={16}/><input name="q" type="search" defaultValue={query.q || ""} placeholder="Szukaj po użytkowniku, e-mailu lub firmie…"/></label><label>Rola<select name="role" defaultValue={selectedRole}><option value="">Wszystkie role</option><option value="administrator">Administrator</option><option value="broker">Broker</option></select></label><label>Data<input name="date" type="date" defaultValue={selectedDate}/></label><button className="button button-primary" type="submit">Filtruj</button></form><div className="table-wrap"><table className="data-table"><thead><tr><th>Użytkownik</th><th>Firma</th><th>Rola</th><th>Logowanie</th><th>Urządzenie</th></tr></thead><tbody>{filtered.length ? filtered.map((item) => <tr key={item.id}><td><strong>{item.full_name}</strong><span className="login-report__email">{item.email || "Brak e-maila"}</span></td><td>{item.company_name || <span className="login-report__muted">—</span>}</td><td><span className={`login-role login-role--${item.role}`}>{roleLabel(item.role)}</span></td><td><strong>{formatDateTime(item.logged_in_at)}</strong></td><td>{item.device_label || <span className="login-report__muted">Nieznane urządzenie</span>}</td></tr>) : <tr><td className="table-empty" colSpan={5}>Brak logowań spełniających wybrane kryteria.</td></tr>}</tbody></table></div></section>
  </AppShell>;
}

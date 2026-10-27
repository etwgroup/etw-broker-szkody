import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { demoProfile } from "@/lib/demo-data";

export type AppProfile = { id: string; full_name: string | null; role: "administrator" | "broker"; email?: string | null; isDemo?: boolean };

export async function requireProfile(requiredRole?: AppProfile["role"]) {
  const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!isSupabaseConfigured) {
    const role = (await cookies()).get("etw_demo_role")?.value as AppProfile["role"] | undefined;
    if (role !== "administrator" && role !== "broker") redirect("/login");
    if (requiredRole && role !== requiredRole) redirect(role === "broker" ? "/broker" : "/admin");
    return { supabase: null, user: { id: `demo-${role}`, email: demoProfile(role).email }, profile: { ...demoProfile(role), isDemo: true } as AppProfile, isDemo: true };
  }
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login?error=Brak%20uprawnień%20do%20panelu.");
  if (requiredRole && profile.role !== requiredRole) redirect(profile.role === "broker" ? "/broker" : "/admin");

  return { supabase, user, profile: { ...profile, email: user.email } as AppProfile, isDemo: false };
}

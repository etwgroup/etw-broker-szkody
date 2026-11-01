import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function deviceLabel(userAgent: string | null) {
  const source = userAgent || "";
  const browser = /edg\//i.test(source)
    ? "Microsoft Edge"
    : /opr\//i.test(source) || /opera/i.test(source)
      ? "Opera"
      : /firefox\//i.test(source)
        ? "Firefox"
        : /chrome\//i.test(source) || /crios\//i.test(source)
          ? "Google Chrome"
          : /safari\//i.test(source)
            ? "Safari"
            : "Przeglądarka";
  const platform = /iphone/i.test(source)
    ? "iPhone"
    : /ipad/i.test(source)
      ? "iPad"
      : /android/i.test(source)
        ? "Android"
        : /windows/i.test(source)
          ? "Windows"
          : /mac os|macintosh/i.test(source)
            ? "macOS"
            : /linux/i.test(source)
              ? "Linux"
              : "nieznane urządzenie";

  return `${browser} · ${platform}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Brak aktywnej sesji." }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, administrator_company_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Brak profilu użytkownika." }, { status: 403 });

    const admin = createAdminSupabaseClient();
    let companyName: string | null = null;
    if (profile.administrator_company_id) {
      const { data: company } = await admin
        .from("administrator_companies")
        .select("name")
        .eq("id", profile.administrator_company_id)
        .maybeSingle();
      companyName = company?.name || null;
    }

    const { error } = await admin.from("user_login_events").insert({
      user_id: profile.id,
      full_name: profile.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Użytkownik",
      email: profile.email || user.email || null,
      role: profile.role,
      company_name: companyName,
      device_label: deviceLabel(request.headers.get("user-agent")),
    });
    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Nie udało się zapisać zdarzenia logowania.", error);
    return NextResponse.json({ error: "Nie udało się zapisać logowania." }, { status: 500 });
  }
}

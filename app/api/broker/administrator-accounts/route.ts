import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AccountPayload = {
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
  companyId?: unknown;
  newCompanyName?: unknown;
  newCompanyNip?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesja wygasła. Zaloguj się ponownie." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "broker") return NextResponse.json({ error: "Tylko broker może tworzyć konta administratorów." }, { status: 403 });

  const payload = await request.json().catch(() => null) as AccountPayload | null;
  const fullName = text(payload?.fullName);
  const email = text(payload?.email).toLowerCase();
  const password = text(payload?.password);
  const companyId = text(payload?.companyId);
  const newCompanyName = text(payload?.newCompanyName);
  const newCompanyNip = text(payload?.newCompanyNip);

  if (fullName.length < 2 || !email.includes("@") || password.length < 8) {
    return NextResponse.json({ error: "Podaj imię i nazwisko, poprawny e-mail oraz hasło zawierające co najmniej 8 znaków." }, { status: 400 });
  }
  if (!companyId && newCompanyName.length < 2) {
    return NextResponse.json({ error: "Wybierz istniejącą firmę albo wpisz nazwę nowej firmy administrującej." }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    let resolvedCompanyId = companyId;
    let createdCompanyId: string | null = null;

    if (resolvedCompanyId) {
      const { data: company, error } = await admin.from("administrator_companies").select("id").eq("id", resolvedCompanyId).maybeSingle();
      if (error || !company) return NextResponse.json({ error: "Wybrana firma administrująca nie istnieje." }, { status: 400 });
    } else {
      const { data: company, error } = await admin
        .from("administrator_companies")
        .insert({ name: newCompanyName, nip: newCompanyNip || null })
        .select("id")
        .single();
      if (error || !company) throw error || new Error("Nie udało się utworzyć firmy administrującej.");
      resolvedCompanyId = company.id;
      createdCompanyId = company.id;
    }

    const { data: account, error: accountError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (accountError || !account.user) {
      if (createdCompanyId) await admin.from("administrator_companies").delete().eq("id", createdCompanyId);
      throw accountError || new Error("Nie udało się utworzyć konta.");
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name: fullName, role: "administrator", administrator_company_id: resolvedCompanyId })
      .eq("id", account.user.id);
    if (profileError) {
      await admin.auth.admin.deleteUser(account.user.id);
      if (createdCompanyId) await admin.from("administrator_companies").delete().eq("id", createdCompanyId);
      throw profileError;
    }

    return NextResponse.json({ ok: true, companyId: resolvedCompanyId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się utworzyć konta administratora." }, { status: 500 });
  }
}

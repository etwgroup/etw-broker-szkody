import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AccountPayload = {
  accountId?: unknown;
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
  companyId?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireBroker() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sesja wygasła. Zaloguj się ponownie." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "broker") return { error: NextResponse.json({ error: "Tylko broker może zarządzać kontami administratorów." }, { status: 403 }) };
  return { error: null };
}

function validatedPayload(payload: AccountPayload | null, options: { passwordRequired: boolean }) {
  const accountId = text(payload?.accountId);
  const fullName = text(payload?.fullName);
  const email = text(payload?.email).toLowerCase();
  const password = text(payload?.password);
  const companyId = text(payload?.companyId);
  if (fullName.length < 2 || !email.includes("@") || !companyId || (options.passwordRequired && password.length < 8)) return null;
  if (!options.passwordRequired && password && password.length < 8) return null;
  return { accountId, fullName, email, password, companyId };
}

async function companyExists(companyId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("administrator_companies").select("id").eq("id", companyId).maybeSingle();
  if (error || !data) throw new Error("Wybrana firma administrująca nie istnieje.");
  return admin;
}

export async function POST(request: Request) {
  const access = await requireBroker();
  if (access.error) return access.error;
  const payload = await request.json().catch(() => null) as AccountPayload | null;
  const input = validatedPayload(payload, { passwordRequired: true });
  if (!input) return NextResponse.json({ error: "Podaj firmę, imię i nazwisko, poprawny e-mail oraz hasło zawierające co najmniej 8 znaków." }, { status: 400 });

  try {
    const admin = await companyExists(input.companyId);
    const { data: account, error: accountError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });
    if (accountError || !account.user) throw accountError || new Error("Nie udało się utworzyć konta.");

    const { error: profileError } = await admin.from("profiles").update({
      full_name: input.fullName,
      email: input.email,
      role: "administrator",
      administrator_company_id: input.companyId,
    }).eq("id", account.user.id);
    if (profileError) {
      await admin.auth.admin.deleteUser(account.user.id);
      throw profileError;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się utworzyć konta administratora." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const access = await requireBroker();
  if (access.error) return access.error;
  const payload = await request.json().catch(() => null) as AccountPayload | null;
  const input = validatedPayload(payload, { passwordRequired: false });
  if (!input?.accountId) return NextResponse.json({ error: "Uzupełnij firmę, imię i nazwisko oraz poprawny e-mail. Nowe hasło musi mieć co najmniej 8 znaków." }, { status: 400 });

  try {
    const admin = await companyExists(input.companyId);
    const { data: accountProfile, error: accountError } = await admin.from("profiles").select("id, role").eq("id", input.accountId).maybeSingle();
    if (accountError || accountProfile?.role !== "administrator") return NextResponse.json({ error: "Nie znaleziono konta administratora." }, { status: 404 });

    const attributes: { email: string; password?: string; user_metadata: { full_name: string } } = { email: input.email, user_metadata: { full_name: input.fullName } };
    if (input.password) attributes.password = input.password;
    const { error: authError } = await admin.auth.admin.updateUserById(input.accountId, attributes);
    if (authError) throw authError;

    const { error: profileError } = await admin.from("profiles").update({
      full_name: input.fullName,
      email: input.email,
      administrator_company_id: input.companyId,
    }).eq("id", input.accountId);
    if (profileError) throw profileError;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się zapisać zmian konta." }, { status: 500 });
  }
}

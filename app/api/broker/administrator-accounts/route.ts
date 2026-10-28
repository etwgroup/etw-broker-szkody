import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AccountPayload = {
  action?: unknown;
  accountId?: unknown;
  fullName?: unknown;
  email?: unknown;
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

function validatedPayload(payload: AccountPayload | null) {
  const accountId = text(payload?.accountId);
  const fullName = text(payload?.fullName);
  const email = text(payload?.email).toLowerCase();
  const companyId = text(payload?.companyId);
  if (fullName.length < 2 || !email.includes("@") || !companyId) return null;
  return { accountId, fullName, email, companyId };
}

function applicationUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return (configuredUrl || new URL(request.url).origin).replace(/\/$/, "");
}

async function resendActivationLink(request: Request, accountId: string) {
  const admin = createAdminSupabaseClient();
  const { data: account, error: accountError } = await admin
    .from("profiles")
    .select("id, full_name, email, role, account_activated_at")
    .eq("id", accountId)
    .maybeSingle();

  if (accountError || !account || account.role !== "administrator") {
    throw new Error("Nie znaleziono konta administratora.");
  }
  if (account.account_activated_at) {
    throw new Error("To konto jest już aktywne.");
  }
  if (!account.email) {
    throw new Error("Konto nie ma przypisanego adresu e-mail.");
  }

  const redirectTo = `${applicationUrl(request)}/auth/set-password`;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(account.email, {
    data: { full_name: account.full_name || "Administrator" },
    redirectTo,
  });

  // Po pierwszym otwarciu zaproszenia e-mail użytkownika może już być
  // potwierdzony, ale konto nadal nieaktywne (np. gdy link wygasł). Wtedy
  // wysyłamy bezpieczny link resetu, który prowadzi do tego samego formularza.
  if (inviteError) {
    const errorCode = "code" in inviteError && typeof inviteError.code === "string" ? inviteError.code : "";
    if (!["email_exists", "user_already_exists"].includes(errorCode)) throw inviteError;
    const { error: recoveryError } = await admin.auth.resetPasswordForEmail(account.email, { redirectTo });
    if (recoveryError) throw recoveryError;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ account_invited_at: new Date().toISOString() })
    .eq("id", account.id);
  if (profileError) throw profileError;
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
  const action = text(payload?.action);

  if (action === "resend-invite") {
    const accountId = text(payload?.accountId);
    if (!accountId) return NextResponse.json({ error: "Nie wskazano konta administratora." }, { status: 400 });
    try {
      await resendActivationLink(request, accountId);
      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się wysłać linku aktywacyjnego." }, { status: 500 });
    }
  }

  const input = validatedPayload(payload);
  if (!input) return NextResponse.json({ error: "Podaj firmę, imię i nazwisko oraz poprawny e-mail." }, { status: 400 });

  try {
    const admin = await companyExists(input.companyId);
    const { data: account, error: accountError } = await admin.auth.admin.inviteUserByEmail(input.email, {
      data: { full_name: input.fullName },
      redirectTo: `${applicationUrl(request)}/auth/set-password`,
    });
    if (accountError || !account.user) throw accountError || new Error("Nie udało się wysłać zaproszenia do utworzenia konta.");

    const { error: profileError } = await admin.from("profiles").update({
      full_name: input.fullName,
      email: input.email,
      role: "administrator",
      administrator_company_id: input.companyId,
      account_invited_at: new Date().toISOString(),
      account_activated_at: null,
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
  const input = validatedPayload(payload);
  if (!input?.accountId) return NextResponse.json({ error: "Uzupełnij firmę, imię i nazwisko oraz poprawny e-mail." }, { status: 400 });

  try {
    const admin = await companyExists(input.companyId);
    const { data: accountProfile, error: accountError } = await admin.from("profiles").select("id, role").eq("id", input.accountId).maybeSingle();
    if (accountError || accountProfile?.role !== "administrator") return NextResponse.json({ error: "Nie znaleziono konta administratora." }, { status: 404 });

    const { error: authError } = await admin.auth.admin.updateUserById(input.accountId, { email: input.email, user_metadata: { full_name: input.fullName } });
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

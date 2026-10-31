import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { COMPANY_LOGO_BUCKET } from "@/lib/company-logo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DeletePayload = { target?: unknown; id?: unknown; password?: unknown };
type Target = "account" | "community" | "company";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function failed(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function verifyBrokerPassword(password: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: failed("Sesja wygasła. Zaloguj się ponownie.", 401) };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "broker") return { error: failed("Tylko broker może usuwać konta i wspólnoty.", 403) };

  if (!password) return { error: failed("Wpisz swoje aktualne hasło.") };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { error: failed("Brakuje konfiguracji Supabase.", 500) };

  // A separate ephemeral client verifies the password without replacing the broker's active session.
  const verifier = createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { error: passwordError } = await verifier.auth.signInWithPassword({ email: user.email, password });
  if (passwordError) return { error: failed("Aktualne hasło jest nieprawidłowe.", 403) };
  return { user, error: null };
}

function nonEmptyPaths(rows: Array<{ storage_path: string | null }> | null | undefined) {
  return (rows || []).map((row) => row.storage_path).filter((path): path is string => Boolean(path));
}

async function removeFiles(admin: ReturnType<typeof createAdminSupabaseClient>, bucket: string, paths: string[]) {
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await admin.storage.from(bucket).remove(paths.slice(index, index + 100));
    if (error) console.error(`Nie udało się usunąć części plików z bucketu ${bucket}.`, error.message);
  }
}

async function removeAdministratorAccount(accountId: string) {
  const admin = createAdminSupabaseClient();
  const { data: account, error: accountError } = await admin.from("profiles").select("id, role").eq("id", accountId).maybeSingle();
  if (accountError || !account || account.role !== "administrator") throw new Error("Nie znaleziono konta administratora.");
  const { error } = await admin.auth.admin.deleteUser(accountId);
  if (error) throw error;
}

async function removeCommunity(communityId: string) {
  const admin = createAdminSupabaseClient();
  const { data: community, error: communityError } = await admin.from("communities").select("id").eq("id", communityId).maybeSingle();
  if (communityError || !community) throw new Error("Nie znaleziono wspólnoty.");

  const [{ data: policies, error: policiesError }, { data: claims, error: claimsError }] = await Promise.all([
    admin.from("insurance_policies").select("storage_path").eq("community_id", communityId),
    admin.from("claims").select("id").eq("community_id", communityId),
  ]);
  if (policiesError || claimsError) throw policiesError || claimsError;

  const claimIds = (claims || []).map((claim) => claim.id);
  let claimPaths: string[] = [];
  let messagePaths: string[] = [];
  if (claimIds.length) {
    const [{ data: attachments, error: attachmentsError }, { data: messages, error: messagesError }] = await Promise.all([
      admin.from("claim_attachments").select("storage_path").in("claim_id", claimIds),
      admin.from("claim_messages").select("id").in("claim_id", claimIds),
    ]);
    if (attachmentsError || messagesError) throw attachmentsError || messagesError;
    claimPaths = nonEmptyPaths(attachments);
    const messageIds = (messages || []).map((message) => message.id);
    if (messageIds.length) {
      const { data: messageAttachments, error: messageAttachmentsError } = await admin.from("claim_message_attachments").select("storage_path").in("message_id", messageIds);
      if (messageAttachmentsError) throw messageAttachmentsError;
      messagePaths = nonEmptyPaths(messageAttachments);
    }
  }

  const { error: deletionError } = await admin.from("communities").delete().eq("id", communityId);
  if (deletionError) throw deletionError;

  await Promise.all([
    removeFiles(admin, "policy-documents", nonEmptyPaths(policies)),
    removeFiles(admin, "claim-attachments", claimPaths),
    removeFiles(admin, "claim-message-attachments", messagePaths),
  ]);
}

async function removeAdministratorCompany(companyId: string) {
  const admin = createAdminSupabaseClient();
  const { data: company, error: companyError } = await admin
    .from("administrator_companies")
    .select("id, logo_path")
    .eq("id", companyId)
    .maybeSingle();
  if (companyError || !company) throw new Error("Nie znaleziono firmy administrującej.");

  // Existing foreign keys retain accounts and communities, but clear their company assignment.
  const { error } = await admin.from("administrator_companies").delete().eq("id", companyId);
  if (error) throw error;
  await removeFiles(admin, COMPANY_LOGO_BUCKET, company.logo_path ? [company.logo_path] : []);
}

export async function DELETE(request: Request) {
  const payload = await request.json().catch(() => null) as DeletePayload | null;
  const target = text(payload?.target) as Target;
  const id = text(payload?.id);
  const password = typeof payload?.password === "string" ? payload.password : "";
  if (!id || !["account", "community", "company"].includes(target)) return failed("Nie wskazano elementu do usunięcia.");

  try {
    const access = await verifyBrokerPassword(password);
    if (access.error) return access.error;
    if (target === "account") await removeAdministratorAccount(id);
    else if (target === "community") await removeCommunity(id);
    else await removeAdministratorCompany(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nie udało się wykonać trwałego usunięcia.", error);
    return failed("Nie udało się usunąć danych. Spróbuj ponownie lub skontaktuj się z administratorem systemu.", 500);
  }
}


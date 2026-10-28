import { NextResponse } from "next/server";
import { sendClaimEmails } from "@/lib/claim-email";
import { loadAdministratorEmailRecipients, loadBrokerEmailRecipients, loadClaimEmailContext } from "@/lib/claim-email-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MessagePayload = { claimId?: unknown; body?: unknown };

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as MessagePayload | null;
  const claimId = text(payload?.claimId);
  const body = text(payload?.body);
  if (!claimId || body.length > 2000) return NextResponse.json({ error: "Nie udało się wysłać odpowiedzi." }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesja wygasła. Zaloguj się ponownie." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "administrator" && profile?.role !== "broker") {
    return NextResponse.json({ error: "Nie masz dostępu do tej sprawy." }, { status: 403 });
  }

  const { data: message, error: messageError } = await supabase
    .from("claim_messages")
    .insert({ claim_id: claimId, sender_id: user.id, body })
    .select("id")
    .single();
  if (messageError || !message) return NextResponse.json({ error: messageError?.message || "Nie udało się zapisać odpowiedzi." }, { status: 400 });

  try {
    const admin = createAdminSupabaseClient();
    const emailClaim = await loadClaimEmailContext(admin, claimId);
    if (emailClaim) {
      const recipients = profile.role === "broker"
        ? await loadAdministratorEmailRecipients(admin, emailClaim.administrator_company_id)
        : await loadBrokerEmailRecipients(admin);
      await sendClaimEmails({
        request,
        kind: profile.role === "broker" ? "broker_message" : "administrator_message",
        claim: emailClaim,
        recipients,
      });
    }
  } catch (error) {
    console.error("Nie udało się wysłać e-maila o odpowiedzi w sprawie.", error);
  }

  return NextResponse.json({ message: { id: message.id } }, { status: 201 });
}

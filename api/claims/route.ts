import { NextResponse } from "next/server";
import { sendClaimEmails } from "@/lib/claim-email";
import { loadBrokerEmailRecipients, loadClaimEmailContext } from "@/lib/claim-email-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateClaimPayload = {
  communityId?: unknown;
  title?: unknown;
  description?: unknown;
  occurredAt?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as CreateClaimPayload | null;
  const communityId = text(payload?.communityId);
  const title = text(payload?.title);
  const description = text(payload?.description);
  const occurredAt = text(payload?.occurredAt);

  if (!communityId || title.length < 3 || title.length > 140 || description.length < 10 || description.length > 5000 || !/^\d{4}-\d{2}-\d{2}$/.test(occurredAt)) {
    return NextResponse.json({ error: "Uzupełnij poprawnie dane zgłoszenia." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesja wygasła. Zaloguj się ponownie." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "administrator") return NextResponse.json({ error: "Tylko administrator może zgłosić szkodę." }, { status: 403 });

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({ community_id: communityId, created_by: user.id, title, description, occurred_at: occurredAt })
    .select("id")
    .single();

  if (claimError || !claim) {
    return NextResponse.json({ error: claimError?.message || "Nie udało się utworzyć zgłoszenia." }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const [emailClaim, recipients] = await Promise.all([
      loadClaimEmailContext(admin, claim.id),
      loadBrokerEmailRecipients(admin),
    ]);
    if (emailClaim) await sendClaimEmails({ request, kind: "claim_created", claim: emailClaim, recipients });
  } catch (error) {
    console.error("Nie udało się wysłać e-maila o nowym zgłoszeniu.", error);
  }

  return NextResponse.json({ claim: { id: claim.id } }, { status: 201 });
}

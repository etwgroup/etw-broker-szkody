import { NextResponse } from "next/server";
import { sendClaimEmails } from "@/lib/claim-email";
import { loadClaimEmailContext, loadClaimReporterEmailRecipient } from "@/lib/claim-email-data";
import { type ClaimStatus, statusMeta } from "@/lib/claims";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type StatusPayload = {
  claimId?: unknown;
  status?: unknown;
  insurerClaimNumber?: unknown;
  paidAmount?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePayout(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value.replace(",", "."));
  return null;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as StatusPayload | null;
  const claimId = text(payload?.claimId);
  const status = text(payload?.status) as ClaimStatus;
  const insurerClaimNumber = text(payload?.insurerClaimNumber);
  const paidAmount = parsePayout(payload?.paidAmount);

  if (!claimId || !(status in statusMeta)) return NextResponse.json({ error: "Wybierz poprawny status szkody." }, { status: 400 });
  if (status === "insurer_claim_number_assigned" && !insurerClaimNumber) return NextResponse.json({ error: "Podaj numer szkody nadany przez ubezpieczyciela." }, { status: 400 });
  if (status === "paid" && (!Number.isFinite(paidAmount) || (paidAmount || 0) <= 0)) return NextResponse.json({ error: "Podaj kwotę wypłaty większą od zera." }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesja wygasła. Zaloguj się ponownie." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "broker") return NextResponse.json({ error: "Tylko broker może zmieniać status szkody." }, { status: 403 });

  const { data: previous, error: previousError } = await supabase.from("claims").select("status").eq("id", claimId).maybeSingle();
  if (previousError || !previous) return NextResponse.json({ error: "Nie znaleziono szkody." }, { status: 404 });

  const { error: updateError } = await supabase
    .from("claims")
    .update({
      status,
      insurer_claim_number: insurerClaimNumber || null,
      ...(status === "paid" ? { paid_amount: paidAmount } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  if (previous.status !== status) {
    try {
      const admin = createAdminSupabaseClient();
      const emailClaim = await loadClaimEmailContext(admin, claimId);
      if (emailClaim) {
        const recipients = await loadClaimReporterEmailRecipient(admin, emailClaim);
        await sendClaimEmails({ request, kind: "status_changed", claim: emailClaim, recipients });
      }
    } catch (error) {
      console.error("Nie udało się wysłać e-maila o zmianie statusu szkody.", error);
    }
  }

  return NextResponse.json({ ok: true });
}

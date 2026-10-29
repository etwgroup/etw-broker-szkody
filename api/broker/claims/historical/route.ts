import { NextResponse } from "next/server";
import { statusMeta, type ClaimStatus } from "@/lib/claims";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type HistoricalClaimPayload = {
  communityId?: unknown;
  title?: unknown;
  description?: unknown;
  occurredAt?: unknown;
  reportedAt?: unknown;
  status?: unknown;
  insurerClaimNumber?: unknown;
  paidAmount?: unknown;
  paidAt?: unknown;
  reportedByName?: unknown;
  reportedByEmail?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parsePayout(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value.replace(",", "."));
  return null;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as HistoricalClaimPayload | null;
  const communityId = text(payload?.communityId);
  const title = text(payload?.title);
  const description = text(payload?.description);
  const occurredAt = text(payload?.occurredAt);
  const reportedAt = text(payload?.reportedAt);
  const status = text(payload?.status) as ClaimStatus;
  const insurerClaimNumber = text(payload?.insurerClaimNumber);
  const paidAmount = parsePayout(payload?.paidAmount);
  const paidAt = text(payload?.paidAt);
  const reportedByName = text(payload?.reportedByName);
  const reportedByEmail = text(payload?.reportedByEmail);

  if (!communityId || title.length < 3 || title.length > 140 || description.length < 10 || description.length > 5000 || !isDate(occurredAt) || !isDate(reportedAt) || !(status in statusMeta)) {
    return NextResponse.json({ error: "Uzupełnij poprawnie wspólnotę, opis, daty i aktualny status szkody." }, { status: 400 });
  }
  if (status === "insurer_claim_number_assigned" && !insurerClaimNumber) {
    return NextResponse.json({ error: "Podaj numer szkody nadany przez ubezpieczyciela." }, { status: 400 });
  }
  if (status === "paid" && (!Number.isFinite(paidAmount) || (paidAmount || 0) <= 0)) {
    return NextResponse.json({ error: "Dla szkody wypłaconej podaj kwotę wypłaty większą od zera." }, { status: 400 });
  }
  if (paidAt && !isDate(paidAt)) {
    return NextResponse.json({ error: "Podaj poprawną datę wypłaty." }, { status: 400 });
  }
  if (reportedByEmail && !/^\S+@\S+\.\S+$/.test(reportedByEmail)) {
    return NextResponse.json({ error: "Podaj poprawny e-mail osoby zgłaszającej albo pozostaw to pole puste." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesja wygasła. Zaloguj się ponownie." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "broker") return NextResponse.json({ error: "Tylko broker może dodać wcześniej zgłoszoną szkodę." }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const { data: community } = await admin.from("communities").select("id").eq("id", communityId).maybeSingle();
  if (!community) return NextResponse.json({ error: "Wybrana wspólnota nie istnieje." }, { status: 404 });

  const { data: claim, error } = await admin
    .from("claims")
    .insert({
      community_id: communityId,
      created_by: user.id,
      title,
      description,
      occurred_at: occurredAt,
      status,
      insurer_claim_number: insurerClaimNumber || null,
      paid_amount: status === "paid" ? paidAmount : null,
      paid_at: status === "paid" && paidAt ? paidAt : null,
      reported_by_name: reportedByName || null,
      reported_by_email: reportedByEmail || null,
      created_at: `${reportedAt}T12:00:00.000Z`,
    })
    .select("id")
    .single();

  if (error || !claim) return NextResponse.json({ error: error?.message || "Nie udało się dodać szkody historycznej." }, { status: 400 });

  return NextResponse.json({ claim: { id: claim.id } }, { status: 201 });
}

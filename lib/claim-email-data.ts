import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClaimEmailContext, ClaimEmailRecipient } from "@/lib/claim-email";

type Community = {
  name?: string | null;
  address?: string | null;
  administrator_company_id?: string | null;
};

type CommunityRow = Community | Community[] | null;

function firstCommunity(community: CommunityRow): Community | undefined {
  if (Array.isArray(community)) return community[0];
  return community || undefined;
}

export async function loadClaimEmailContext(admin: SupabaseClient, claimId: string): Promise<ClaimEmailContext | null> {
  const { data, error } = await admin
    .from("claims")
    .select("id, created_by, reference, title, status, insurer_claim_number, paid_amount, reported_by_name, reported_by_email, communities(name, address, administrator_company_id)")
    .eq("id", claimId)
    .maybeSingle();

  if (error || !data) return null;
  const community = firstCommunity(data.communities as CommunityRow);
  if (!community) return null;

  return {
    id: data.id,
    created_by: data.created_by,
    reference: data.reference,
    title: data.title,
    status: data.status,
    reported_by_name: data.reported_by_name,
    reported_by_email: data.reported_by_email,
    insurer_claim_number: data.insurer_claim_number,
    paid_amount: data.paid_amount,
    community_name: community.name || "Wspólnota mieszkaniowa",
    community_address: community.address || "Brak adresu",
    administrator_company_id: community.administrator_company_id || null,
  };
}

function recipients(rows: Array<{ email: string | null; full_name: string | null }> | null) {
  return (rows || []) as ClaimEmailRecipient[];
}

export async function loadBrokerEmailRecipients(admin: SupabaseClient) {
  const { data } = await admin.from("profiles").select("email, full_name").eq("role", "broker").not("email", "is", null);
  return (data || [])
    .filter((profile) => Boolean(profile.email))
    .map((profile) => ({ email: profile.email as string, full_name: "Jessica Klimiuk-Waszczuk" }));
}

export async function loadAdministratorEmailRecipients(admin: SupabaseClient, companyId: string | null) {
  if (!companyId) return [];
  const { data } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("role", "administrator")
    .eq("administrator_company_id", companyId)
    .not("account_activated_at", "is", null)
    .not("email", "is", null);
  return recipients(data);
}

/** The reporter is the only administrator who receives claim e-mails. */
export async function loadClaimReporterEmailRecipient(admin: SupabaseClient, claim: ClaimEmailContext) {
  if (claim.reported_by_email?.trim()) {
    return [{ email: claim.reported_by_email, full_name: claim.reported_by_name || null }] satisfies ClaimEmailRecipient[];
  }

  const { data } = await admin.from("profiles").select("email, full_name").eq("id", claim.created_by).maybeSingle();
  return recipients(data ? [data] : null);
}

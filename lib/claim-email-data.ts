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
    .select("id, reference, title, status, insurer_claim_number, paid_amount, communities(name, address, administrator_company_id)")
    .eq("id", claimId)
    .maybeSingle();

  if (error || !data) return null;
  const community = firstCommunity(data.communities as CommunityRow);
  if (!community) return null;

  return {
    id: data.id,
    reference: data.reference,
    title: data.title,
    status: data.status,
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
  return recipients(data);
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

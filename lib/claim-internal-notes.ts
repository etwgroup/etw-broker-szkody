import type { SupabaseClient } from "@supabase/supabase-js";

export type ClaimInternalNote = {
  id: string;
  claim_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export async function loadClaimInternalNotes(supabase: SupabaseClient, claimId: string): Promise<ClaimInternalNote[]> {
  const { data } = await supabase
    .from("claim_internal_notes")
    .select("id, claim_id, author_name, body, created_at")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false });
  return (data || []) as ClaimInternalNote[];
}

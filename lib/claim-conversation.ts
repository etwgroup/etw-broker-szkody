import type { SupabaseClient } from "@supabase/supabase-js";

export type ClaimMessageAttachment = {
  id: string;
  message_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path?: string | null;
  url?: string | null;
};

export type ClaimMessage = {
  id: string;
  claim_id: string;
  sender_id: string;
  sender_role: "administrator" | "broker";
  sender_name: string | null;
  body: string;
  created_at: string;
  attachments: ClaimMessageAttachment[];
};

export async function loadClaimConversation(supabase: SupabaseClient, claimId: string): Promise<ClaimMessage[]> {
  const { data: messages } = await supabase
    .from("claim_messages")
    .select("id, claim_id, sender_id, sender_role, sender_name, body, created_at")
    .eq("claim_id", claimId)
    .order("created_at");

  if (!messages?.length) return [];
  const messageIds = messages.map((message) => message.id);
  const { data: attachments } = await supabase
    .from("claim_message_attachments")
    .select("id, message_id, file_name, mime_type, size_bytes, storage_path")
    .in("message_id", messageIds)
    .order("created_at");

  const attachmentsWithUrls = await Promise.all((attachments || []).map(async (attachment) => ({
    ...attachment,
    url: attachment.storage_path
      ? (await supabase.storage.from("claim-message-attachments").createSignedUrl(attachment.storage_path, 3600)).data?.signedUrl
      : undefined,
  })));

  return messages.map((message) => ({
    ...message,
    attachments: attachmentsWithUrls.filter((attachment) => attachment.message_id === message.id),
  })) as ClaimMessage[];
}

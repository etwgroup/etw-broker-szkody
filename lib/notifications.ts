import type { SupabaseClient } from "@supabase/supabase-js";

export type AppNotification = {
  id: string;
  notification_type: "claim_created" | "claim_message" | "claim_status_changed";
  claim_id: string | null;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export async function loadNotifications(supabase: SupabaseClient): Promise<AppNotification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("id, notification_type, claim_id, title, body, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data || []) as AppNotification[];
}

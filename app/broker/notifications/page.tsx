import { AppShell } from "@/components/app-shell";
import { NotificationsCenter } from "@/components/notifications-center";
import { requireProfile } from "@/lib/auth";
import { demoNotifications } from "@/lib/demo-data";
import { loadNotifications } from "@/lib/notifications";

export default async function BrokerNotificationsPage() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const notifications = isDemo ? demoNotifications.filter((item) => item.recipient_role === "broker") : await loadNotifications(supabase!);
  return <AppShell profile={profile}><NotificationsCenter notifications={notifications} role="broker" demo={isDemo}/></AppShell>;
}

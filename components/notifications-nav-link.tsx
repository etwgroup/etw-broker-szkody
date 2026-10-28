"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { demoNotifications } from "@/lib/demo-data";

type Role = "administrator" | "broker";

export function NotificationsNavLink({ role, demo = false }: { role: Role; demo?: boolean }) {
  const pathname = usePathname();
  const href = `/${role}/notifications`;
  const [count, setCount] = useState(demo ? demoNotifications.filter((item) => item.recipient_role === role && !item.read_at).length : 0);
  const refreshCount = useCallback(async () => {
    if (demo) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count: unreadCount } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null);
    setCount(unreadCount || 0);
  }, [demo]);

  useEffect(() => {
    void refreshCount();
    const interval = window.setInterval(() => void refreshCount(), 45000);
    const update = () => void refreshCount();
    window.addEventListener("etw-notifications-updated", update);
    return () => { window.clearInterval(interval); window.removeEventListener("etw-notifications-updated", update); };
  }, [refreshCount]);

  return <Link href={href} className={`nav-link notification-nav-link ${pathname === href ? "active" : ""}`}><Bell size={17}/><span>Powiadomienia</span>{count > 0 && <b>{count > 99 ? "99+" : count}</b>}</Link>;
}

"use client";

import { BellRing, CheckCheck, ClipboardPlus, MessageCircleMore, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDateTime } from "@/lib/claims";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/notifications";

type Role = "administrator" | "broker";

function NotificationIcon({ type }: { type: AppNotification["notification_type"] }) {
  if (type === "claim_created") return <ClipboardPlus size={18}/>;
  if (type === "claim_message") return <MessageCircleMore size={18}/>;
  return <RefreshCw size={17}/>;
}

export function NotificationsCenter({ notifications, role, demo = false }: { notifications: AppNotification[]; role: Role; demo?: boolean }) {
  const [items, setItems] = useState(notifications);
  const [pendingAll, setPendingAll] = useState(false);
  const unreadCount = items.filter((item) => !item.read_at).length;
  const markRead = async (id: string) => {
    const current = items.find((item) => item.id === id);
    if (!current || current.read_at) return;
    const timestamp = new Date().toISOString();
    setItems((previous) => previous.map((item) => item.id === id ? { ...item, read_at: timestamp } : item));
    if (!demo) {
      const supabase = createClient();
      const { error } = await supabase.from("notifications").update({ read_at: timestamp }).eq("id", id);
      if (error) setItems((previous) => previous.map((item) => item.id === id ? current : item));
    }
    window.dispatchEvent(new Event("etw-notifications-updated"));
  };
  const markAllRead = async () => {
    if (!unreadCount) return;
    const timestamp = new Date().toISOString();
    const previous = items;
    setPendingAll(true);
    setItems((current) => current.map((item) => item.read_at ? item : { ...item, read_at: timestamp }));
    try {
      if (!demo) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Brak aktywnej sesji.");
        const { error } = await supabase.from("notifications").update({ read_at: timestamp }).eq("recipient_id", user.id).is("read_at", null);
        if (error) throw error;
      }
    } catch {
      setItems(previous);
    } finally {
      setPendingAll(false);
      window.dispatchEvent(new Event("etw-notifications-updated"));
    }
  };

  return <section className="notifications-center panel"><header><div><p className="kicker">Centrum powiadomień</p><h1><BellRing size={22}/> Powiadomienia</h1><p>Informacje o zgłoszeniach, odpowiedziach oraz zmianach statusu szkód.</p></div>{unreadCount > 0 && <button className="button button-ghost" type="button" onClick={() => void markAllRead()} disabled={pendingAll}><CheckCheck size={16}/> Oznacz wszystkie jako przeczytane</button>}</header><div className="notifications-center__summary">{unreadCount ? `Masz ${unreadCount} nieprzeczytane ${unreadCount === 1 ? "powiadomienie" : "powiadomienia"}.` : "Nie masz nieprzeczytanych powiadomień."}</div><div className="notifications-center__list">{items.length ? items.map((item) => <Link onClick={() => void markRead(item.id)} className={`notification-item ${item.read_at ? "notification-item--read" : ""}`} href={item.claim_id ? `/${role}/damages/${item.claim_id}` : `/${role}`} key={item.id}><span className="notification-item__icon"><NotificationIcon type={item.notification_type}/></span><span><strong>{item.title}</strong><p>{item.body}</p><small>{formatDateTime(item.created_at)}</small></span>{!item.read_at && <i aria-label="Nieprzeczytane"/>}</Link>) : <div className="empty-state"><BellRing size={25}/><p>Brak powiadomień.</p></div>}</div></section>;
}

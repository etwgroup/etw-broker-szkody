import type { ClaimStatus } from "@/lib/claims";

export const demoCommunities = [
  { id: "demo-community-1", name: "Wspólnota Słoneczna 12", address: "ul. Słoneczna 12, Warszawa" },
  { id: "demo-community-2", name: "Wspólnota Parkowa 8", address: "ul. Parkowa 8, Warszawa" },
];

export type DemoClaim = {
  id: string; reference: string; title: string; description: string; status: ClaimStatus;
  occurred_at: string; created_at: string; insurer_claim_number?: string | null; reported_by_name?: string | null; reported_by_email?: string | null; communities: (typeof demoCommunities)[number];
};

export const demoClaims: DemoClaim[] = [
  { id: "demo-claim-1", reference: "ETW-2026-01001", title: "Zalanie pionu w lokalu 14", description: "W wyniku awarii instalacji wodnej doszło do zalania ściany oraz sufitu w korytarzu na II piętrze. Miejsce zostało zabezpieczone, a administrator zlecił wstępne oględziny.", status: "received", occurred_at: "2026-10-19", created_at: "2026-10-20T09:42:00+02:00", reported_by_name: "Anna Administrator", reported_by_email: "administrator@etw.demo", communities: demoCommunities[0] },
  { id: "demo-claim-2", reference: "ETW-2026-00984", title: "Uszkodzenie bramy wjazdowej", description: "Mechanizm bramy wjazdowej został uszkodzony. Do zgłoszenia dołączono zdjęcia oraz kosztorys naprawy.", status: "insurer_claim_number_assigned", insurer_claim_number: "WARTA/2026/00984", occurred_at: "2026-10-13", created_at: "2026-10-14T13:18:00+02:00", reported_by_name: "Anna Administrator", reported_by_email: "administrator@etw.demo", communities: demoCommunities[1] },
  { id: "demo-claim-3", reference: "ETW-2026-00935", title: "Szkoda po silnym wietrze", description: "Silny wiatr uszkodził obróbkę blacharską na dachu budynku. Naprawa została wykonana i rozliczona.", status: "paid", occurred_at: "2026-09-27", created_at: "2026-09-28T08:12:00+02:00", reported_by_name: "Anna Administrator", reported_by_email: "administrator@etw.demo", communities: demoCommunities[0] },
];

export const demoAttachments = [
  { id: "demo-file-1", file_name: "zdjecie-zalania-01.jpg", mime_type: "image/jpeg", size_bytes: 840000, url: undefined },
  { id: "demo-file-2", file_name: "kosztorys-naprawy.pdf", mime_type: "application/pdf", size_bytes: 291000, url: undefined },
];

export const demoHistory = [
  { id: "demo-history-3", status: "insurer_claim_number_assigned", created_at: "2026-10-16T12:20:00+02:00", note: "Numer szkody ubezpieczyciela: WARTA/2026/00984." },
  { id: "demo-history-2", status: "received", created_at: "2026-10-20T10:16:00+02:00", note: "Zgłoszenie zweryfikowane przez brokera." },
  { id: "demo-history-1", status: "new", created_at: "2026-10-20T09:42:00+02:00", note: "Szkoda zgłoszona przez administratora." },
];

export const demoClaimMessages = [
  {
    id: "demo-message-1",
    claim_id: "demo-claim-1",
    sender_id: "demo-broker",
    sender_role: "broker" as const,
    sender_name: "Jessica Klimiuk-Waszczuk",
    body: "Proszę o dosłanie zdjęć miejsca zdarzenia oraz kosztorysu pierwszych prac zabezpieczających.",
    created_at: "2026-10-20T12:15:00+02:00",
    attachments: [{ id: "demo-message-file-1", message_id: "demo-message-1", file_name: "lista-wymaganych-dokumentow.pdf", mime_type: "application/pdf", size_bytes: 120000, url: "data:text/plain;charset=utf-8,ETW%20Broker%20-%20lista%20wymaganych%20dokumentow" }],
  },
  {
    id: "demo-message-2",
    claim_id: "demo-claim-1",
    sender_id: "demo-administrator",
    sender_role: "administrator" as const,
    sender_name: "Anna Administrator",
    body: "Dokumenty są w przygotowaniu. Prześlemy je po otrzymaniu kosztorysu od wykonawcy.",
    created_at: "2026-10-20T13:04:00+02:00",
    attachments: [],
  },
];

export const demoPolicies = [
  { id: "demo-policy-1", community_id: "demo-community-1", insurer: "PZU S.A.", policy_number: "PZU/WM/2026/001284", valid_from: "2026-01-01", valid_to: "2026-12-31", file_name: "polisa-wspolnota-sloneczna-12.pdf", download_url: "data:text/plain;charset=utf-8,ETW%20Broker%20-%20demonstracyjna%20polisa%20Wspolnoty%20Sloneczna%2012" },
  { id: "demo-policy-archive-1", community_id: "demo-community-1", insurer: "PZU S.A.", policy_number: "PZU/WM/2025/000917", valid_from: "2025-01-01", valid_to: "2025-12-31", file_name: "polisa-wspolnota-sloneczna-12-2025.pdf", download_url: "data:text/plain;charset=utf-8,ETW%20Broker%20-%20archiwalna%20polisa%20Wspolnoty%20Sloneczna%2012%202025" },
  { id: "demo-policy-2", community_id: "demo-community-2", insurer: "Warta S.A.", policy_number: "WARTA/WM/2026/04591", valid_from: "2026-03-01", valid_to: "2027-02-28", file_name: "polisa-wspolnota-parkowa-8.pdf", download_url: "data:text/plain;charset=utf-8,ETW%20Broker%20-%20demonstracyjna%20polisa%20Wspolnoty%20Parkowa%208" },
];

export function demoProfile(role: "administrator" | "broker") {
  return role === "broker"
    ? { id: "demo-broker", full_name: "Marta Broker", email: "broker@etw.demo", role }
    : { id: "demo-administrator", full_name: "Anna Administrator", email: "administrator@etw.demo", role };
}

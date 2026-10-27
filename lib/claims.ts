export const statusMeta = {
  new: { label: "Nowa", className: "status--new" },
  received: { label: "Przyjęta", className: "status--received" },
  submitted_to_insurer: { label: "Zgłoszona do ubezpieczyciela", className: "status--submitted" },
  insurer_claim_number_assigned: { label: "Przypisany numer szkody przez ubezpieczyciela", className: "status--insurer-number" },
  rejected: { label: "Odrzucona", className: "status--rejected" },
  accepted: { label: "Zaakceptowana", className: "status--accepted" },
  paid: { label: "Wypłacona", className: "status--paid" },
} as const;

export type ClaimStatus = keyof typeof statusMeta;

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

import { CalendarDays, Download, FileText, MapPin, Paperclip } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/claims";
import { StatusBadge } from "@/components/status-badge";

type Attachment = { id: string; file_name: string; mime_type: string | null; size_bytes: number | null; url?: string | null };
type History = { id: string; status: string; created_at: string; note?: string | null };
type Community = { name?: string; address?: string };
type Claim = { reference: string; title: string; description: string; status: string; occurred_at: string; created_at: string; insurer_claim_number?: string | null; communities?: Community | Community[] | null };

export function ClaimDetail({ claim, attachments, history }: { claim: Claim; attachments: Attachment[]; history: History[] }) {
  const community = Array.isArray(claim.communities) ? claim.communities[0] : claim.communities;
  return <div className="detail-grid"><section className="panel detail-card"><div className="page-top"><div><p className="kicker">{claim.reference}</p><h1>{claim.title}</h1></div><StatusBadge status={claim.status}/></div><h2>Opis szkody</h2><p>{claim.description}</p>{attachments.length > 0 && <><h2 className="section-title"><Paperclip size={16}/> Załączniki ({attachments.length})</h2><div className="file-list">{attachments.map((file) => <a key={file.id} className="file-item" href={file.url || "#"} target="_blank" rel="noreferrer"><FileText size={14}/><span>{file.file_name}</span><Download size={13}/></a>)}</div></>}</section><aside className="detail-aside"><section className="panel detail-card"><h2>Informacje o sprawie</h2><dl className="info-list"><div><dt>Wspólnota</dt><dd>{community?.name || "—"}</dd></div><div><dt>Adres</dt><dd><MapPin size={12}/>{community?.address || "—"}</dd></div><div><dt>Data zdarzenia</dt><dd><CalendarDays size={12}/>{formatDate(claim.occurred_at)}</dd></div><div><dt>Data zgłoszenia</dt><dd>{formatDateTime(claim.created_at)}</dd></div>{claim.insurer_claim_number && <div><dt>Numer szkody ubezpieczyciela</dt><dd className="insurer-claim-number">{claim.insurer_claim_number}</dd></div>}</dl></section><section className="panel detail-card timeline-card"><h2>Historia statusu</h2><div className="timeline">{history.map((entry) => <div className="timeline-item" key={entry.id}><strong><StatusBadge status={entry.status}/></strong><span>{formatDateTime(entry.created_at)}{entry.note ? ` · ${entry.note}` : ""}</span></div>)}</div></section></aside></div>;
}

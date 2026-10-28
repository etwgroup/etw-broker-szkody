import { CalendarDays, Download, FileArchive, FileWarning } from "lucide-react";
import { formatDate } from "@/lib/claims";
import { policyYear, type InsurancePolicy } from "@/lib/policies";

export function PolicyArchive({ policies }: { policies: InsurancePolicy[] }) {
  const groups = Object.entries(policies.reduce<Record<string, InsurancePolicy[]>>((result, policy) => {
    const year = policyYear(policy);
    result[year] = [...(result[year] || []), policy];
    return result;
  }, {})).sort(([firstYear], [secondYear]) => Number(secondYear) - Number(firstYear));

  return <section className="policy-archive panel">
    <div className="policy-archive__heading"><span><FileArchive size={19}/></span><div><p className="kicker">Dokumentacja ubezpieczeniowa</p><h2>Archiwalne polisy</h2><p>Poprzednie dokumenty są uporządkowane według roku zakończenia ochrony.</p></div></div>
    {groups.length ? <div className="policy-archive__years">{groups.map(([year, yearPolicies]) => <details key={year} className="policy-archive__year" open={groups[0][0] === year}><summary><span>Rok {year}</span><small>{yearPolicies.length === 1 ? "1 polisa" : `${yearPolicies.length} polisy`}</small></summary><div className="policy-archive__items">{yearPolicies.map((policy) => <article key={policy.id} className="policy-archive__item"><div><strong>{policy.insurer}</strong><span>Nr {policy.policy_number}</span><small><CalendarDays size={12}/>{formatDate(policy.valid_from)} – {formatDate(policy.valid_to)}</small></div>{policy.download_url ? <a className="button button-ghost" href={policy.download_url} download={policy.file_name || "polisa.pdf"}><Download size={15}/> Pobierz</a> : <span className="policy-archive__missing"><FileWarning size={14}/> Brak pliku</span>}</article>)}</div></details>)}</div> : <div className="policy-archive__empty"><FileArchive size={22}/><p>Brak archiwalnych polis dla tej wspólnoty.</p></div>}
  </section>;
}

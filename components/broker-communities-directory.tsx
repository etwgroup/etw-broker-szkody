"use client";

import { Building2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Company = { id: string; name: string };
type Community = { id: string; name: string; address: string; nip: string | null; regon: string | null; administrator_company_id: string | null };

export function BrokerCommunitiesDirectory({ communities, companies }: { communities: Community[]; companies: Company[] }) {
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pl-PL");
    if (!normalized) return communities;
    return communities.filter((community) => [community.name, community.address, community.nip, community.regon].filter(Boolean).join(" ").toLocaleLowerCase("pl-PL").includes(normalized));
  }, [communities, query]);

  return <section className="broker-communities-directory">
    <div className="community-toolbar"><Search size={17}/><input aria-label="Wyszukaj wspólnotę" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wyszukaj po nazwie, adresie, NIP lub REGON…"/><span>{items.length} z {communities.length}</span></div>
    {items.length ? <section className="communities-grid">{items.map((community) => <Link className="community-card broker-community-card" key={community.id} href={`/broker/communities/${community.id}`}><span className="community-icon"><Building2 size={19}/></span><div><h2>{community.name}</h2><p><MapPin size={13}/>{community.address}</p>{community.nip && <small>NIP: {community.nip}</small>}{community.regon && <small>REGON: {community.regon}</small>}<span className="broker-community-card__company">{companies.find((company) => company.id === community.administrator_company_id)?.name || "Nieprzypisana do firmy"}</span></div></Link>)}</section> : <div className="empty-state"><Search size={25}/><p>Nie znaleziono wspólnot spełniających kryteria wyszukiwania.</p></div>}
  </section>;
}

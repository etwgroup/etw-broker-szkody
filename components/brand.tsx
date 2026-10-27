import Link from "next/link";

export function Brand({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return <Link href={href} className={`brand ${compact ? "brand--compact" : ""}`} aria-label="ETW Broker — strona główna">
    <span className="brand-logo"><img src="/etw-broker-logo.png" alt="ETW Broker" /></span>
    {!compact && <span className="brand-copy"><b>ETW</b><small>BROKER</small></span>}
  </Link>;
}

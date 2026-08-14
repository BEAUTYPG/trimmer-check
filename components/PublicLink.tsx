"use client";

import { useEffect, useState } from "react";

export default function PublicLink({ slug }: { slug: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/q/${slug}`);
  }, [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* alcuni browser lo bloccano: il link resta comunque visibile */
    }
  }

  return (
    <div className="note" style={{ marginTop: 22 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Il link del tuo salone</div>
      <div style={{ wordBreak: "break-all", fontSize: 14 }}>{url || "…"}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button className="btn" style={{ width: "auto", padding: "10px 18px" }} onClick={copy}>
          {copied ? "Copiato" : "Copia link"}
        </button>
        {url && (
          <a className="btn" style={{ width: "auto", padding: "10px 18px", textAlign: "center", textDecoration: "none" }} href={`/q/${slug}`} target="_blank" rel="noreferrer">
            Apri
          </a>
        )}
      </div>
    </div>
  );
}

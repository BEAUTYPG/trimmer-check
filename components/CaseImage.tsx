"use client";

import { useState } from "react";

/**
 * Coppia prima/dopo di un caso reale.
 * Cerca le foto in /cases/caso{n}-prima.jpg e /cases/caso{n}-dopo.jpg
 * (cartella public/cases del progetto). Finche' le foto non ci sono,
 * mostra un segnaposto elegante nei colori dell'app: si puo' pubblicare
 * subito e aggiungere le foto in un secondo momento senza toccare codice.
 */
export default function CaseImage({
  caseId,
  height = 190,
}: {
  caseId: number;
  height?: number;
}) {
  const [okPrima, setOkPrima] = useState(true);
  const [okDopo, setOkDopo] = useState(true);

  const label = (text: string) => (
    <span
      style={{
        position: "absolute", left: 10, bottom: 8,
        color: "#fff", fontSize: 11, letterSpacing: ".1em",
        textTransform: "uppercase", textShadow: "0 1px 6px rgba(0,0,0,.45)",
      }}
    >
      {text}
    </span>
  );

  const half = (which: "prima" | "dopo", ok: boolean, setOk: (v: boolean) => void) => (
    <div style={{ flex: 1, position: "relative", overflow: "hidden",
      background: which === "prima"
        ? "linear-gradient(160deg,#b7a08b,#8a7361)"
        : "linear-gradient(160deg,#d9b98c,#a8734a)" }}>
      {ok && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/cases/caso${caseId}-${which}.jpg`}
          alt={which === "prima" ? "Prima" : "Dopo"}
          onError={() => setOk(false)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
      {label(which === "prima" ? "Prima" : "Dopo")}
    </div>
  );

  return (
    <div style={{ display: "flex", height, borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
      {half("prima", okPrima, setOkPrima)}
      {half("dopo", okDopo, setOkDopo)}
    </div>
  );
}

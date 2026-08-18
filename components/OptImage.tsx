"use client";

import { useState } from "react";

/**
 * Immagine di un'opzione di risposta.
 * Ordine di ricerca:
 *   1. /q-imgs/<id>.jpg   (cartella public/q-imgs del progetto)
 *   2. /q-imgs/<id>.png
 *   3. URL remoto (immagine generata, finche' non self-hostiamo)
 * Se non trova nulla, non mostra niente: resta il testo dell'opzione.
 *
 * wide = true -> immagine a sinistra nella card larga (ultima opzione).
 */
export default function OptImage({
  id,
  cdn,
  wide = false,
}: {
  id: string;
  cdn?: string;
  wide?: boolean;
}) {
  // 0 = jpg locale, 1 = png locale, 2 = cdn, 3 = nulla
  const [stage, setStage] = useState(0);

  const src =
    stage === 0 ? `/q-imgs/${id}.jpg` :
    stage === 1 ? `/q-imgs/${id}.png` :
    stage === 2 && cdn ? cdn : null;

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setStage((s) => s + 1)}
      className={wide ? "optimg-wide" : "optimg"}
    />
  );
}

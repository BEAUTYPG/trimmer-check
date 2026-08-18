"use client";

import { useState } from "react";

/**
 * Immagine di copertina (schermata 0).
 * File atteso: public/cover/hero.jpg
 * Se manca, al posto della foto compare un fondo pieno nei colori del brand:
 * il titolo sopra resta leggibile e la schermata non si rompe mai.
 */
export default function CoverImage() {
  const [ok, setOk] = useState(true);

  if (!ok) return <div className="hero-fallback" />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/cover/hero.jpg"
      alt=""
      className="hero-img"
      onError={() => setOk(false)}
    />
  );
}

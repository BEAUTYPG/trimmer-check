"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

/**
 * Imposta o cambia la password dell'account salone.
 * Funziona solo da dentro l'area riservata (serve la sessione attiva):
 * chi entra la prima volta con il link via email passa di qui una volta
 * sola, poi entra sempre con email e password.
 */
export default function PasswordForm() {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (pw1.length < 8) { setMsg("La password deve avere almeno 8 caratteri."); return; }
    if (pw1 !== pw2) { setMsg("Le due password non coincidono."); return; }

    setState("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw1 });

    if (error) {
      setState("error");
      setMsg(
        /same password/i.test(error.message)
          ? "Questa è già la tua password attuale."
          : error.message
      );
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="note" style={{ marginTop: 24 }}>
        Password salvata. Dal prossimo accesso ti basta email e password:
        niente più attese per il link via email.
      </div>
    );
  }

  return (
    <form onSubmit={save}>
      <div className="card" style={{ marginTop: 24 }}>
        <label className="fld" style={{ marginTop: 0 }}>
          Nuova password (almeno 8 caratteri)
          <input
            type="password"
            autoComplete="new-password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            placeholder="Nuova password"
          />
        </label>
        <label className="fld">
          Ripeti la password
          <input
            type="password"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Uguale a sopra"
          />
        </label>
      </div>

      <div className="row">
        <button className="btn accent" type="submit" disabled={state === "saving"}>
          {state === "saving" ? "Salvataggio…" : "Salva la password"}
        </button>
      </div>

      {msg && <div className="tiny" style={{ marginTop: 10, color: "var(--red)" }}>{msg}</div>}
    </form>
  );
}

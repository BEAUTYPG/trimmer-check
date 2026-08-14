"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setMsg("Controlla l'indirizzo email."); return; }

    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) { setState("error"); setMsg(error.message); return; }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="note" style={{ marginTop: 24 }}>
        Ti ho inviato il link di accesso a <b>{email}</b>. Apri l&apos;email e clicca
        il link: torni qui già dentro. Se non lo vedi, controlla nello spam.
      </div>
    );
  }

  return (
    <form onSubmit={send}>
      <div className="card" style={{ marginTop: 24 }}>
        <label className="fld" style={{ marginTop: 0 }}>
          Email del salone
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@salone.it"
          />
        </label>
      </div>

      <div className="row">
        <button className="btn accent" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Invio in corso…" : "Ricevi il link di accesso"}
        </button>
      </div>

      {msg && <div className="tiny" style={{ marginTop: 10, color: "var(--red)" }}>{msg}</div>}
    </form>
  );
}

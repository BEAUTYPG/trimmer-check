"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

/**
 * Accesso all'area salone.
 *
 * Due strade:
 *  - PASSWORD (via principale): email + password, entri subito.
 *  - LINK VIA EMAIL (riserva): per chi non ha ancora impostato una
 *    password, o l'ha dimenticata. Una volta dentro, la password si
 *    imposta dalla pagina /password.
 */
export default function LoginForm() {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function sendPassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!email.includes("@")) { setMsg("Controlla l'indirizzo email."); return; }
    if (!password) { setMsg("Scrivi la password."); return; }

    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setState("error");
      setMsg(
        /invalid/i.test(error.message)
          ? "Email o password non corretti. Se non hai mai impostato una password, entra con il link via email e impostala da lì."
          : error.message
      );
      return;
    }
    // ricarico dalla radice: il server vede la sessione e porta in dashboard
    window.location.href = "/dashboard";
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
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
    <form onSubmit={mode === "password" ? sendPassword : sendLink}>
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

        {mode === "password" && (
          <label className="fld">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="La tua password"
            />
          </label>
        )}
      </div>

      <div className="row">
        <button className="btn accent" type="submit" disabled={state === "sending"}>
          {state === "sending"
            ? mode === "password" ? "Accesso in corso…" : "Invio in corso…"
            : mode === "password" ? "Entra" : "Ricevi il link di accesso"}
        </button>
      </div>

      {msg && <div className="tiny" style={{ marginTop: 10, color: "var(--red)" }}>{msg}</div>}

      <p className="tiny" style={{ marginTop: 16, textAlign: "center" }}>
        {mode === "password" ? (
          <>
            Password dimenticata, o mai impostata?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode("link"); setMsg(""); }}>
              Entra con il link via email
            </a>
          </>
        ) : (
          <>
            Hai già una password?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode("password"); setMsg(""); }}>
              Entra con email e password
            </a>
          </>
        )}
      </p>
    </form>
  );
}

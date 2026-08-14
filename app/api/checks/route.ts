import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { compute, topAxis, Q, QUESTIONS_VER, INFORMATIVA_VER, type Answers } from "@/lib/engine";

export const dynamic = "force-dynamic";

/**
 * Salvataggio di una scheda.
 *
 * Il punteggio viene RICALCOLATO qui, sul server, ignorando qualunque
 * risultato arrivi dal browser: cosi' nessuno puo' far apparire un
 * orientamento diverso da quello che le risposte producono davvero.
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const { salonSlug, answers, client, consents, source } = body ?? {};

  if (typeof salonSlug !== "string" || !Array.isArray(answers)) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  // le risposte devono avere la forma attesa dal questionario
  if (answers.length !== Q.length) {
    return NextResponse.json({ error: "Questionario incompleto" }, { status: 400 });
  }

  const isAnonymous = Boolean(client?.anonymous);

  // Senza consenso privacy non si salva nulla di riconducibile a una persona.
  if (!isAnonymous && !consents?.privacy) {
    return NextResponse.json({ error: "Consenso mancante" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: salon, error: salonErr } = await supabase
    .from("salons")
    .select("id")
    .eq("slug", salonSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (salonErr || !salon) {
    return NextResponse.json({ error: "Salone non trovato" }, { status: 404 });
  }

  const result = compute(answers as Answers);
  const top = topAxis(result);

  const trim = (v: unknown, max = 120) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

  const { data, error } = await supabase
    .from("checks")
    .insert({
      salon_id: salon.id,
      source: source === "salon" ? "salon" : "public",
      is_anonymous: isAnonymous,
      client_first_name: isAnonymous ? null : trim(client?.firstName),
      client_last_name:  isAnonymous ? null : trim(client?.lastName),
      client_phone:      isAnonymous ? null : trim(client?.phone, 40),
      client_email:      isAnonymous ? null : trim(client?.email, 160),
      consent_privacy:   isAnonymous ? false : Boolean(consents?.privacy),
      consent_email:     isAnonymous ? false : Boolean(consents?.email),
      consent_marketing: isAnonymous ? false : Boolean(consents?.marketing),
      informativa_ver:   isAnonymous ? null : INFORMATIVA_VER,
      questions_ver: QUESTIONS_VER,
      answers,
      result,
      top_axis: top.k,
      has_alert: result.hasAlert,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Salvataggio non riuscito" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, result });
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default async function Onboarding({
  searchParams,
}: {
  searchParams: { errore?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: existing } = await supabase
    .from("memberships")
    .select("salon_id")
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) redirect("/dashboard");

  async function createSalon(formData: FormData) {
    "use server";

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/");

    const name = String(formData.get("name") || "").trim();
    const city = String(formData.get("city") || "").trim();
    if (!name) redirect("/onboarding?errore=nome");

    const base = toSlug(name) || "salone";
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: salon, error } = await supabase
      .from("salons")
      .insert({ name, city: city || null, slug, owner_id: user.id })
      .select("id")
      .single();

    if (error || !salon) redirect("/onboarding?errore=creazione");

    const { error: mErr } = await supabase
      .from("memberships")
      .insert({ user_id: user.id, salon_id: salon.id, role: "owner" });

    if (mErr) redirect("/onboarding?errore=iscrizione");

    redirect("/dashboard");
  }

  return (
    <>
      <div className="top">
        <span className="brand">Trimmer Check</span>
      </div>

      <h1>Il tuo salone</h1>
      <p className="muted" style={{ marginTop: 10 }}>
        Un solo passaggio. Il nome che scrivi qui è quello che la cliente vede
        in cima al questionario.
      </p>

      <form action={createSalon}>
        <div className="card" style={{ marginTop: 24 }}>
          <label className="fld" style={{ marginTop: 0 }}>
            Nome del salone
            <input type="text" name="name" required placeholder="Es. VIDA Hair Milano" />
          </label>
          <label className="fld">
            Città <span className="tiny">(facoltativa)</span>
            <input type="text" name="city" placeholder="Es. Milano" />
          </label>
        </div>

        <div className="row">
          <button className="btn accent" type="submit">Crea il salone</button>
        </div>
      </form>

      {searchParams?.errore && (
        <div className="tiny" style={{ marginTop: 14, color: "var(--red)" }}>
          Non sono riuscito a creare il salone. Riprova, e se persiste segnalalo.
        </div>
      )}
    </>
  );
}

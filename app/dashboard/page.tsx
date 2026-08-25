import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AXES } from "@/lib/engine";
import PublicLink from "@/components/PublicLink";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

type CheckRow = {
  id: string;
  created_at: string;
  client_first_name: string | null;
  client_last_name: string | null;
  is_anonymous: boolean;
  top_axis: string | null;
  has_alert: boolean;
  source: string;
  result: { pct?: Record<string, number>; tags?: string[]; objection?: string } | null;
};

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: memberships } = await supabase
    .from("memberships")
    .select("salon_id, salons(id, name, slug, city)")
    .eq("user_id", user.id)
    .limit(1);

  if (!memberships || memberships.length === 0) redirect("/onboarding");

  const salon = (memberships[0] as any).salons as {
    id: string; name: string; slug: string; city: string | null;
  };

  const { data: checks } = await supabase
    .from("checks")
    .select("id, created_at, client_first_name, client_last_name, is_anonymous, top_axis, has_alert, source, result")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (checks || []) as CheckRow[];
  const conAlert = rows.filter((r) => r.has_alert).length;

  const label = (k: string | null) =>
    AXES.find((a) => a.k === k)?.label ?? "—";

  return (
    <>
      <div className="top">
        <span className="brand">{salon.name}</span>
        <LogoutButton />
      </div>

      <h1>Schede raccolte</h1>
      <p className="muted" style={{ marginTop: 10 }}>
        {rows.length === 0
          ? "Non c'è ancora nessuna scheda. Apri il link qui sotto su un tablet, o mandalo alla cliente prima dell'appuntamento."
          : `${rows.length} schede${conAlert > 0 ? ` · ${conAlert} con segnalazione da valutare` : ""}.`}
      </p>

      <PublicLink slug={salon.slug} />

      <div className="row" style={{ marginTop: 12 }}>
        <Link href="/analisi" className="btn" style={{ textAlign: "center", textDecoration: "none" }}>
          Analisi e funnel →
        </Link>
      </div>

      <p className="tiny" style={{ marginTop: 10, textAlign: "center" }}>
        <Link href="/password">Imposta o cambia la password di accesso</Link>
      </p>

      {rows.length > 0 && (
        <div style={{ marginTop: 26 }}>
          {rows.map((r) => {
            const nome = r.is_anonymous
              ? "Prova anonima"
              : [r.client_first_name, r.client_last_name].filter(Boolean).join(" ") || "Senza nome";
            const data = new Date(r.created_at).toLocaleDateString("it-IT", {
              day: "2-digit", month: "short", year: "numeric",
            });
            const pct = r.result?.pct?.[r.top_axis || ""] ?? null;

            return (
              <Link key={r.id} href={`/scheda/${r.id}`} className="card" style={{ display: "block", marginBottom: 10, textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <b>{nome}</b>
                  <span className="tiny">{data}</span>
                </div>
                <div className="muted" style={{ fontSize: 15, marginTop: 6 }}>
                  {label(r.top_axis)}{pct !== null ? ` · ${pct}%` : ""}
                  {r.source === "salon" ? " · compilata in salone" : ""}
                </div>
                {r.has_alert && (
                  <div className="tiny" style={{ marginTop: 8, color: "var(--red)" }}>
                    Da valutare in consulenza prima di procedere
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

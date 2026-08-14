import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <>
      <div className="top">
        <span className="brand">Trimmer Check</span>
      </div>

      <h1>Area salone</h1>
      <p className="muted" style={{ marginTop: 10 }}>
        Accedi per raccogliere e rivedere le schede delle tue clienti.
        Non serve una password: ti arriva un link via email.
      </p>

      <LoginForm />

      <p className="tiny" style={{ marginTop: 28 }}>
        Il questionario per le clienti non richiede accesso: si apre dal link
        pubblico del tuo salone, che trovi qui dentro dopo il primo ingresso.
      </p>
    </>
  );
}

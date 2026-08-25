import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PasswordForm from "@/components/PasswordForm";

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <>
      <div className="top">
        <span className="brand">Trimmer Check</span>
        <Link href="/dashboard" className="tiny" style={{ textDecoration: "none" }}>
          ← Schede
        </Link>
      </div>

      <h1>La tua password</h1>
      <p className="muted" style={{ marginTop: 10 }}>
        Imposta una password per entrare subito, senza aspettare il link via
        email. La usi insieme all&apos;indirizzo <b>{user.email}</b>.
      </p>

      <PasswordForm />
    </>
  );
}

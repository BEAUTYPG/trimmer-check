import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Questionnaire from "@/components/Questionnaire";

export const dynamic = "force-dynamic";

export default async function PublicQuestionnaire({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  // select("*") cosi' la pagina funziona anche se la colonna phone
  // non e' ancora stata aggiunta con la migrazione.
  const { data: salon } = await supabase
    .from("salons")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!salon) notFound();

  return (
    <Questionnaire
      salonSlug={salon.slug}
      salonName={salon.name}
      salonPhone={(salon as any).phone ?? null}
    />
  );
}

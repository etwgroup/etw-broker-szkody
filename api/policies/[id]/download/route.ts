import { createServerSupabaseClient } from "@/lib/supabase/server";

function downloadName(name: string | null) {
  return (name || "polisa.pdf").replace(/[\\/\r\n\"]/g, "_");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Zaloguj się ponownie, aby pobrać polisę.", { status: 401 });

  const { data: policy, error: policyError } = await supabase
    .from("insurance_policies")
    .select("file_name, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (policyError || !policy?.storage_path) return new Response("Nie znaleziono pliku polisy.", { status: 404 });

  const { data: file, error: fileError } = await supabase.storage.from("policy-documents").download(policy.storage_path);
  if (fileError || !file) return new Response("Plik polisy nie jest obecnie dostępny.", { status: 404 });

  const name = downloadName(policy.file_name);
  return new Response(file, {
    headers: {
      "Content-Type": file.type || "application/pdf",
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

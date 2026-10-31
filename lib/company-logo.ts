import type { SupabaseClient } from "@supabase/supabase-js";

export const COMPANY_LOGO_BUCKET = "administrator-company-logos";
export const COMPANY_LOGO_MAX_BYTES = 2 * 1024 * 1024;

const acceptedExtensions = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
]);

function extensionFromFile(file: File) {
  return file.name.split(".").pop()?.trim().toLowerCase() || "";
}

export function validateCompanyLogo(file: File) {
  const extension = extensionFromFile(file);
  const expectedType = acceptedExtensions.get(extension);
  if (!expectedType || (file.type && file.type !== expectedType)) {
    return "Logo musi być plikiem PNG, JPG lub WebP.";
  }
  if (file.size > COMPANY_LOGO_MAX_BYTES) {
    return "Logo firmy nie może być większe niż 2 MB.";
  }
  return null;
}

export function companyLogoUrl(path: string | null | undefined) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!url || !path) return null;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${COMPANY_LOGO_BUCKET}/${encodedPath}`;
}

export async function uploadCompanyLogo(supabase: SupabaseClient, companyId: string, file: File) {
  const validationError = validateCompanyLogo(file);
  if (validationError) throw new Error(validationError);

  const extension = extensionFromFile(file);
  const contentType = acceptedExtensions.get(extension)!;
  const storagePath = `${companyId}/${crypto.randomUUID()}.${extension === "jpeg" ? "jpg" : extension}`;
  const { error } = await supabase.storage.from(COMPANY_LOGO_BUCKET).upload(storagePath, file, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return storagePath;
}

export async function removeCompanyLogo(supabase: SupabaseClient, path: string | null | undefined) {
  if (!path) return;
  const { error } = await supabase.storage.from(COMPANY_LOGO_BUCKET).remove([path]);
  if (error) throw error;
}

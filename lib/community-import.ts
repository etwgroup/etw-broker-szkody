import { read, utils } from "xlsx";

export type ImportedCommunity = {
  name: string;
  address: string;
  nip: string | null;
  regon: string | null;
  sourceAdministrator: string | null;
};

type SpreadsheetRow = Array<string | number | boolean | null | undefined>;

function cleanText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function formatNip(value: unknown) {
  const digits = cleanText(value).replace(/\D/g, "");
  if (!digits) return null;
  return digits.padStart(10, "0").slice(-10);
}

function formatRegon(value: unknown) {
  const digits = cleanText(value).replace(/\D/g, "");
  if (!digits) return null;
  return digits.padStart(digits.length <= 9 ? 9 : 14, "0").slice(-14);
}

function formatAddress(streetValue: unknown, buildingNumberValue: unknown, postalCodeValue: unknown, cityValue: unknown) {
  const street = cleanText(streetValue);
  const buildingNumber = cleanText(buildingNumberValue);
  const postalCode = cleanText(postalCodeValue);
  const city = cleanText(cityValue);
  const streetWithPrefix = street && !/^(ul\.?|al\.?|aleja|pl\.?)\s/i.test(street) ? `ul. ${street}` : street;
  const streetAndNumber = [streetWithPrefix, buildingNumber].filter(Boolean).join(" ");
  const place = [postalCode, city].filter(Boolean).join(" ");
  return [streetAndNumber, place].filter(Boolean).join(", ");
}

/**
 * Reads the 2026 ETW collective register. Its data starts on row 4:
 * B name, C postal code, D city, E street, F building number, G REGON, H NIP, AQ administrator.
 */
export function parseCommunityWorkbook(file: ArrayBuffer): ImportedCommunity[] {
  const workbook = read(file, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) return [];

  const rows = utils.sheet_to_json<SpreadsheetRow>(worksheet, { header: 1, defval: "" }).slice(3);
  const parsed = rows.map((row) => {
    const name = cleanText(row[1]);
    const address = formatAddress(row[4], row[5], row[2], row[3]);
    return {
      name,
      address,
      nip: formatNip(row[7]),
      regon: formatRegon(row[6]),
      sourceAdministrator: cleanText(row[42]) || null,
    };
  }).filter((community) => community.name && community.address);

  const seen = new Set<string>();
  return parsed.filter((community) => {
    const key = community.nip || `${community.name}|${community.address}`.toLocaleLowerCase("pl-PL");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

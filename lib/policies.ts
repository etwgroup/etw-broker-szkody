export type InsurancePolicy = {
  id: string;
  insurer: string;
  policy_number: string;
  valid_from: string;
  valid_to: string;
  file_name: string | null;
  storage_path?: string | null;
  created_at?: string;
  download_url?: string;
};

export function getCurrentPolicy(policies: InsurancePolicy[]) {
  const today = new Date().toISOString().slice(0, 10);
  return policies.find((policy) => policy.valid_from <= today && policy.valid_to >= today)
    || policies.find((policy) => policy.valid_to >= today)
    || null;
}

/** Only documents whose protection period has ended belong in the archive. */
export function getArchivedPolicies(policies: InsurancePolicy[]) {
  const today = new Date().toISOString().slice(0, 10);
  return policies.filter((policy) => policy.valid_to < today);
}

export function policyYear(policy: InsurancePolicy) {
  return policy.valid_to.slice(0, 4) || policy.valid_from.slice(0, 4);
}

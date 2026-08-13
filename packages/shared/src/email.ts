/** Normalise une adresse email pour comparaison et stockage (trim + minuscules). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

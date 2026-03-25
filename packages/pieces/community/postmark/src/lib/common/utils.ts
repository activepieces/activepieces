/**
 * Normalise an optional array of email addresses into a single
 * comma-separated string accepted by the Postmark API.
 */
export function normalizeEmails(emails?: string[]): string | undefined {
  if (!emails || emails.length === 0) return undefined;
  return emails
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
    .join(', ');
}

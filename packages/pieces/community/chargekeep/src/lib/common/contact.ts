import { chargekeepClient } from './client';

function assertIdentity({ firstName, lastName, companyName, emails, contactId, contactXref }: { firstName?: unknown; lastName?: unknown; companyName?: unknown; emails?: unknown[]; contactId?: number; contactXref?: unknown }): void {
  if (contactId !== undefined || chargekeepClient.text(contactXref)) return;
  const named = [firstName, lastName, companyName].some((v) => chargekeepClient.text(v));
  const emailed = (emails ?? []).some((v) => chargekeepClient.text(v));
  if (!named && !emailed) {
    throw new Error('Provide at least one of First Name, Last Name, Company Name or an email (or a Contact ID / XREF to update an existing contact).');
  }
}

function splitFullName({ fullName, firstName, lastName }: { fullName?: unknown; firstName?: unknown; lastName?: unknown }): { firstName?: string; lastName?: string } {
  const first = chargekeepClient.text(firstName);
  const last = chargekeepClient.text(lastName);
  const full = chargekeepClient.text(fullName);
  if (first || last || !full) return { firstName: first, lastName: last };
  const parts = full.split(/\s+/);
  return { firstName: parts[0], lastName: parts.length > 1 ? parts.slice(1).join(' ') : undefined };
}

export const contactCommon = { assertIdentity, splitFullName };

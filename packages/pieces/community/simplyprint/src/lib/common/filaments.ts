import { HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

import { simplyprintClient } from './client';
import { Filament } from './types';

// Resolve a user-supplied filament identifier to its numeric spool ID.
// Pure positive integer → returned as-is (no API round-trip). Anything else
// → looked up against the company's spool list as a `uid` (the 4-character
// short ID printed on the QR sticker / NFC tag, case-insensitive).
//
// `filament/GetFilament` doesn't expose a `uid` filter server-side, so we
// pull the compact list and search client-side. Compact response is small
// enough (a few hundred spools max in practice) that a single extra request
// when a uid is supplied is fine.
async function resolveFilamentId(
  auth: OAuth2PropertyValue,
  identifier: string | number,
): Promise<number> {
  const raw = String(identifier ?? '').trim();
  if (!raw) throw new Error('Filament ID or short ID is required.');

  if (/^\d+$/.test(raw)) {
    const n = parseInt(raw, 10);
    if (n > 0) return n;
  }

  const res = await simplyprintClient.simplyprintCall<{
    filament: Record<string, Filament> | Filament[];
  }>({
    auth,
    method: HttpMethod.POST,
    path: 'filament/GetFilament',
    body: { compact: true },
  });
  const map = res.filament ?? {};
  const list = Array.isArray(map) ? map : Object.values(map);

  const lower = raw.toLowerCase();
  const found = list.find((f) => (f.uid ?? '').toLowerCase() === lower);
  if (!found) {
    throw new Error(
      `No filament found with short ID "${raw}" on this account. Pass either the numeric spool ID or the 4-character short ID printed on the QR sticker.`,
    );
  }
  return Number(found.id);
}

export const simplyprintFilaments = {
  resolveFilamentId,
};

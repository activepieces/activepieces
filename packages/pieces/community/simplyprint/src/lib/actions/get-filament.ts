import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { Filament } from '../common/types';

export const getFilamentAction = createAction({
  auth: simplyprintAuth,
  name: 'get_filament',
  displayName: 'Get Filament',
  description: 'Get detailed information about a specific filament spool by numeric ID or 4-character short ID (uid).',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only lookup of a single filament spool\'s full details by numeric spool ID or 4-char short ID (uid). Pick this when you already have one spool reference and need its current attributes (material, color, remaining amount, etc.); to enumerate spools instead, use the list action.',
    idempotent: true,
  },
  props: {
    filamentId: Property.ShortText({
      displayName: 'Filament',
      description:
        'Numeric spool ID, OR the 4-character short ID (`uid`) printed on the QR sticker / NFC tag. In automation flows this typically comes from a previous step (trigger payload, MCP response, etc.).',
      required: true,
    }),
  },
  async run(context) {
    // `filament/GetSpecific` accepts either `id` (numeric) or `uid`
    // (4-char short id) as a GET param. It used to be panel-only but
    // now allows OAuth / private-API / MCP callers (gated by the
    // `isPrivateAPIRequest || isOAuthRequest || isMcpRequest` check on
    // the access guard).
    const raw = String(context.propsValue.filamentId).trim();
    if (!raw) throw new Error('Filament ID or short ID is required.');

    const queryParams: Record<string, string> = /^\d+$/.test(raw)
      ? { id: raw }
      : { uid: raw };

    const res = await simplyprintClient.simplyprintCall<{ data: Filament }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'filament/GetSpecific',
      queryParams,
    });
    return res.data ?? null;
  },
});

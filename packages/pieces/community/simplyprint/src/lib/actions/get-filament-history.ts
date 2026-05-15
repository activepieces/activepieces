import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const getFilamentHistoryAction = createAction({
  auth: simplyprintAuth,
  name: 'get_filament_history',
  displayName: 'Get Filament History',
  description: 'Paginated usage history for a specific spool — print jobs, weight adjustments, drying cycles, etc.',
  props: {
    filamentId: Property.ShortText({
      displayName: 'Filament',
      description: 'Numeric spool ID, OR the 4-character short ID (`uid`) printed on the QR sticker / NFC tag.',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page (optional)',
      description: 'Page number (1-based). Defaults to 1.',
      required: false,
    }),
    perPage: Property.Number({
      displayName: 'Per page (optional)',
      description: 'Items per page (max 100). Defaults to backend default.',
      required: false,
    }),
  },
  async run(context) {
    // filament/History reads `id` (numeric) or `uid` (string) from $this->GET.
    // Pass through whichever form the caller supplied; backend handles both.
    const raw = String(context.propsValue.filamentId).trim();
    const queryParams: Record<string, string> = {};
    if (/^\d+$/.test(raw)) {
      queryParams['id'] = raw;
    } else {
      queryParams['uid'] = raw;
    }
    if (typeof context.propsValue.page === 'number' && context.propsValue.page >= 1) {
      queryParams['page'] = String(Math.floor(context.propsValue.page));
    }
    if (typeof context.propsValue.perPage === 'number' && context.propsValue.perPage > 0) {
      queryParams['perPage'] = String(Math.min(100, Math.floor(context.propsValue.perPage)));
    }

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'filament/History',
      queryParams,
    });
  },
});

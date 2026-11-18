import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetCalendarExportsOutputSchema } from '../../../output-schemas';

export const getCalendarExportsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_calendar_exports',
  outputSchema: podioGetCalendarExportsOutputSchema,
  displayName: 'Get Calendar Exports',
  description: 'Lists the external calendar exports configured for the global calendar.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every export of the global Podio calendar of the connected user to linked external calendar accounts, with the target calendar, minimum priority and whether tasks are exported. Use Get Calendar Exports by Reference for the exports of one app or workspace.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const exports = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/calendar/export/` });
    return { exports, count: exports.length };
  },
});

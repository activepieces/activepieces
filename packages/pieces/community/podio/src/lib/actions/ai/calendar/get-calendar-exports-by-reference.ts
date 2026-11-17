import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetCalendarExportsOutputSchema } from '../../../output-schemas';

export const getCalendarExportsByReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_calendar_exports_by_reference',
  outputSchema: podioGetCalendarExportsOutputSchema,
  displayName: 'Get Calendar Exports by Reference',
  description: 'Lists the external calendar exports configured for an app or workspace calendar.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every export of one app or workspace calendar to linked external calendar accounts, with the target calendar, minimum priority and whether tasks are exported. The app id comes from Get App, the space id from Get Space or List Org Spaces.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.choice({ required: true, displayName: 'Reference Type', description: 'The type of the object: "app" or "space".', values: ['app', 'space'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the app or workspace.' }),
  },
  async run({ auth, propsValue }) {
    const exports = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/calendar/export/${propsValue.refType}/${propsValue.refId}/` });
    return { exports, count: exports.length };
  },
});

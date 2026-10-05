import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { listSchedulesActionOutputSchema } from '../output-schemas';

export const calcomListSchedules = createAction({
  auth: calcomAuth,
  name: 'calcom_list_schedules',
  classification: 'SEARCH',
  displayName: 'List Schedules',
  description: 'List all of the connected user\'s availability schedules.',
  audience: 'ai',
  outputSchema: listSchedulesActionOutputSchema,
  aiMetadata: {
    description:
      'Lists the authenticated user\'s availability schedules, including which one is marked default. Use to resolve a schedule id before Get Schedule, Update Schedule or Delete Schedule.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const { auth } = context;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/schedules',
      version: calcomCommon.versions.schedules,
    });
  },
});

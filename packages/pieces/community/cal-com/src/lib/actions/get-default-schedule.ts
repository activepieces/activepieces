import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { scheduleActionOutputSchema } from '../output-schemas';

export const calcomGetDefaultSchedule = createAction({
  auth: calcomAuth,
  name: 'calcom_get_default_schedule',
  classification: 'READ',
  displayName: 'Get Default Schedule',
  description: 'Get the connected user\'s default availability schedule.',
  audience: 'ai',
  outputSchema: scheduleActionOutputSchema,
  aiMetadata: {
    description:
      'Retrieves the authenticated user\'s own default availability schedule directly, without needing its id. Prefer List Schedules when you need every schedule, not just the default.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const { auth } = context;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/schedules/default',
      version: calcomCommon.versions.schedules,
    });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { scheduleActionOutputSchema } from '../output-schemas';

export const calcomGetSchedule = createAction({
  auth: calcomAuth,
  name: 'calcom_get_schedule',
  classification: 'READ',
  displayName: 'Get Schedule',
  description: 'Get the full details of one availability schedule by id.',
  audience: 'ai',
  outputSchema: scheduleActionOutputSchema,
  aiMetadata: {
    description:
      'Retrieves full details for one availability schedule by id, including its weekly availability blocks and date overrides. Get the id from List Schedules.',
    idempotent: true,
  },
  props: {
    schedule_id: Property.Number({
      displayName: 'Schedule ID',
      description: 'Get this from List Schedules.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { schedule_id } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: `/schedules/${schedule_id}`,
      version: calcomCommon.versions.schedules,
    });
  },
});

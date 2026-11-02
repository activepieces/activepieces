import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';

export const calcomDeleteSchedule = createAction({
  auth: calcomAuth,
  name: 'calcom_delete_schedule',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Schedule',
  description: 'Permanently delete an availability schedule by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes an availability schedule by id. Get the id from List Schedules. Not idempotent: a repeat call on the same id fails because it is already gone.',
    idempotent: false,
  },
  props: {
    schedule_id: Property.Number({
      displayName: 'Schedule ID',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { schedule_id } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/schedules/${schedule_id}`,
      version: calcomCommon.versions.schedules,
    });
  },
});

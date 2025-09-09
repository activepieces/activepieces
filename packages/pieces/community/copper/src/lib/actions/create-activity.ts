import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const createActivity = createAction({
  auth: copperAuth,
  name: 'copper_create_activity',
  displayName: 'Create Activity',
  description: 'Logs a new activity (call, email, note) in Copper.',
  props: {
    activity_type: Property.Dropdown({
      displayName: 'Activity Type',
      required: true,
      options: async () => ({
        options: [
          { label: 'User', value: 'user' },
          { label: 'Note', value: 'note' },
          { label: 'Call', value: 'call' },
          { label: 'Email', value: 'email' },
          { label: 'Meeting', value: 'meeting' },
        ],
      }),
    }),
    details: Property.LongText({ displayName: 'Activity Details', required: true }),
    parent: Property.Object({
      displayName: 'Parent Resource',
      required: true,
      description: 'The resource this activity is associated with (person, company, opportunity, etc.)',
    }),
    user_id: Property.Number({ displayName: 'User ID', required: false }),
    activity_date: Property.DateTime({ displayName: 'Activity Date', required: false }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {
      type: ctx.propsValue.activity_type,
      details: ctx.propsValue.details,
      parent: ctx.propsValue.parent,
      user_id: ctx.propsValue.user_id,
      activity_date: ctx.propsValue.activity_date || new Date().toISOString(),
    };

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/activities`,
      body,
    });
  },
});

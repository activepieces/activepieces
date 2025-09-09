import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createActivity = createAction({
  auth: copperAuth,
  name: 'copper_create_activity',
  displayName: 'Create Activity',
  description: 'Log a new activity in Copper',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Activity Type',
      description: 'Type of activity to log',
      required: true,
      options: {
        options: [
          { label: 'Note', value: 'note' },
          { label: 'Phone Call', value: 'call' },
          { label: 'Email', value: 'email' },
          { label: 'Meeting', value: 'meeting' },
          { label: 'Task', value: 'task' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    details: Property.LongText({
      displayName: 'Activity Details',
      description: 'Description of the activity',
      required: true,
    }),
    activity_date: Property.DateTime({
      displayName: 'Activity Date',
      description: 'When the activity occurred',
      required: false,
    }),
    parent: Property.Json({
      displayName: 'Related Record',
      description: 'Related record as JSON object with type and id (e.g., {"type": "person", "id": 123})',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'ID of the user who performed the activity',
      required: false,
    }),
  },
  async run(context) {
    const { 
      type, 
      details, 
      activity_date, 
      parent, 
      user_id
    } = context.propsValue;

    const body: any = {
      type,
      details,
      parent,
    };

    if (activity_date) body.activity_date = activity_date;
    if (user_id) body.user_id = user_id;

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/activities',
      body,
    });

    return response;
  },
});

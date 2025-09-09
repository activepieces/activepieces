import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchActivity = createAction({
  auth: copperAuth,
  name: 'copper_search_activity',
  displayName: 'Search Activity',
  description: 'Search for activities in Copper',
  props: {
    parent_type: Property.StaticDropdown({
      displayName: 'Parent Type',
      description: 'Type of record the activity is related to',
      required: false,
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Lead', value: 'lead' },
          { label: 'Company', value: 'company' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Project', value: 'project' },
        ],
      },
    }),
    parent_id: Property.ShortText({
      displayName: 'Parent ID',
      description: 'ID of the record the activity is related to',
      required: false,
    }),
    activity_type: Property.StaticDropdown({
      displayName: 'Activity Type',
      description: 'Type of activity to search for',
      required: false,
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
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'Search by user who performed the activity',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { parent_type, parent_id, activity_type, user_id, limit } = context.propsValue;

    const body: any = {
      page_size: limit || 20,
    };

    if (parent_type && parent_id) {
      body.parent = {
        type: parent_type,
        id: parseInt(parent_id)
      };
    }

    if (activity_type) {
      body.type = activity_type;
    }

    if (user_id) {
      body.user_id = parseInt(user_id);
    }

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/activities/search',
      body,
    });

    return response;
  },
});

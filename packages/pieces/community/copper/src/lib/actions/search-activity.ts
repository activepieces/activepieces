import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const searchActivity = createAction({
  auth: copperAuth,
  name: 'copper_search_activity',
  displayName: 'Search for an Activity',
  description: 'Find an existing activity by type/criteria.',
  props: {
    activity_type: Property.Dropdown({
      displayName: 'Activity Type',
      required: false,
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
    parent_type: Property.Dropdown({
      displayName: 'Parent Type',
      required: false,
      options: async () => ({
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Company', value: 'company' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Lead', value: 'lead' },
          { label: 'Project', value: 'project' },
        ],
      }),
    }),
    parent_id: Property.Number({ displayName: 'Parent ID', required: false }),
    user_id: Property.Number({ displayName: 'User ID', required: false }),
    minimum_activity_date: Property.DateTime({ displayName: 'Minimum Activity Date', required: false }),
    maximum_activity_date: Property.DateTime({ displayName: 'Maximum Activity Date', required: false }),
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {
      page_size: ctx.propsValue.page_size || 20,
    };
    
    if (ctx.propsValue.activity_type) body.type = ctx.propsValue.activity_type;
    if (ctx.propsValue.parent_type && ctx.propsValue.parent_id) {
      body.parent = {
        type: ctx.propsValue.parent_type,
        id: ctx.propsValue.parent_id,
      };
    }
    if (ctx.propsValue.user_id) body.user_id = ctx.propsValue.user_id;
    if (ctx.propsValue.minimum_activity_date) body.minimum_activity_date = ctx.propsValue.minimum_activity_date;
    if (ctx.propsValue.maximum_activity_date) body.maximum_activity_date = ctx.propsValue.maximum_activity_date;

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/activities/search`,
      body,
    });
  },
});

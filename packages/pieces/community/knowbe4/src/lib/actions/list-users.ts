import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knowbe4Auth } from '../auth';
import { knowbe4ApiRequest } from '../common';

export const listUsers = createAction({
  auth: knowbe4Auth,
  name: 'list_users',
  displayName: 'List Users',
  description: 'List all users in your KnowBe4 account',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by user status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
    groupId: Property.Number({
      displayName: 'Group ID',
      description: 'Filter by group ID',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Results per page (default: 100, max: 500)',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    if (context.propsValue.status) {
      queryParams['status'] = context.propsValue.status;
    }
    if (context.propsValue.groupId) {
      queryParams['group_id'] = String(context.propsValue.groupId);
    }
    if (context.propsValue.page) {
      queryParams['page'] = String(context.propsValue.page);
    }
    if (context.propsValue.perPage) {
      queryParams['per_page'] = String(context.propsValue.perPage);
    }

    return await knowbe4ApiRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/users',
      queryParams,
    });
  },
});

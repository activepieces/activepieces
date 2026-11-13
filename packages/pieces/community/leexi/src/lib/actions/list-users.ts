import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { leexiAuth } from '../common/auth';
import { leexiApi } from '../common/client';
import { LeexiListResponse, LeexiUser } from '../common/types';
import { leexiOutputFields } from '../common/constants';

export const listUsersAction = createAction({
  name: 'list_users',
  classification: 'SEARCH',
  auth: leexiAuth,
  displayName: 'List Users',
  description: 'List the users of the Leexi workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Leexi workspace users (uuid, name, email, active, license, roles, team) one page at a time. Use it to resolve a person to the user UUID needed by Query Calls (owner / participating user filters) or Create Meeting Event. Read-only.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'data', label: 'Users', listItems: leexiOutputFields.user, labelKey: 'name' },
      { key: 'pagination', label: 'Pagination', children: leexiOutputFields.pagination },
    ],
  },
  props: {
    items: Property.Number({
      displayName: 'Results per Page',
      description: 'Number of users per page, 1-100. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const items = Math.min(100, Math.max(1, Math.floor(context.propsValue.items ?? 100)));
    const page = Math.max(1, Math.floor(context.propsValue.page ?? 1));
    return await leexiApi.request<LeexiListResponse<LeexiUser>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: ['users'],
      query: { items, page },
    });
  },
});

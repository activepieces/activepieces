import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexUser } from '../common';

export const listUsers = createAction({
  auth: brexAuth,
  name: 'list_users',
  displayName: 'List Users',
  description: 'List users in your Brex account, optionally filtered by email.',
  props: {
    email: Property.ShortText({
      displayName: 'Filter by Email',
      description:
        'Return only the user with this exact email address. Leave empty to list all users.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of users to return (1-100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { email, limit } = context.propsValue;
    const response = await brexCommon.apiCall<{ items: BrexUser[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/users',
      queryParams: {
        limit: String(limit ?? 50),
        ...(email ? { email } : {}),
      },
    });
    return response.body.items.map(brexCommon.flattenUser);
  },
});

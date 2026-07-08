import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listUserShortlinksAction = createAction({
  name: 'list_user_shortlinks',
  displayName: 'List User Shortlinks',
  description: 'List all shortlinks for your user account',
  audience: 'both',
  aiMetadata: { description: 'List the shortlinks owned by the authenticated Zoo user, with optional limit and offset for paging. Read-only and repeatable. Use the organization shortlinks action to list links across the whole org instead of just this user.', idempotent: true },
  auth: zooAuth,
  // category: 'Shortlinks',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'Maximum number of shortlinks to return',
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      description: 'Number of shortlinks to skip',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/shortlinks',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      queryParams: {
        ...(propsValue.limit && { limit: propsValue.limit.toString() }),
        ...(propsValue.offset && { offset: propsValue.offset.toString() }),
      },
    });
    return response.body;
  },
});

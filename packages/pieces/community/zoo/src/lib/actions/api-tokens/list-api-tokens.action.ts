import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listApiTokensAction = createAction({
  name: 'list_api_tokens',
  displayName: 'List API Tokens',
  description: 'List all API tokens for your user account',
  audience: 'both',
  aiMetadata: { description: 'List the API tokens on the authenticated user\'s account, with optional limit and offset paging. Use to enumerate tokens or find a token value to pass to the get or delete API token actions. Read-only and idempotent.', idempotent: true },
  auth: zooAuth,
  // category: 'API Tokens',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'Maximum number of tokens to return',
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      description: 'Number of tokens to skip',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/api-tokens',
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

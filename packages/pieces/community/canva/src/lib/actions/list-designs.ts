import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';

export const canvaListDesigns = createAction({
  auth: canvaAuth,
  name: 'list_designs',
  displayName: 'List Designs',
  description: 'List all designs in your Canva account',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Optional search term to filter designs',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of designs to return (default 50)',
      required: false,
    }),
    continuation: Property.ShortText({
      displayName: 'Continuation Token',
      description: 'Token for pagination (from previous response)',
      required: false,
    }),
  },
  async run(context) {
    const { query, limit, continuation } = context.propsValue;
    const accessToken = context.auth.access_token;

    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (limit) params.append('limit', String(limit));
    if (continuation) params.append('continuation', continuation);

    const queryString = params.toString();
    const url = `https://api.canva.com/rest/v1/designs${queryString ? '?' + queryString : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.body;
  },
});

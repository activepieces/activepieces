import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const searchDesigns = createAction({
  auth: canvaAuth,
  name: 'search_designs',
  displayName: 'Search Designs',
  description: 'Search for designs in your Canva account.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Text to search for in design titles.',
      required: false,
    }),
    continuation: Property.ShortText({
      displayName: 'Continuation Token',
      description: 'Token for fetching the next page of results.',
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, string> = {};
    if (context.propsValue.query) params['query'] = context.propsValue.query;
    if (context.propsValue.continuation) params['continuation'] = context.propsValue.continuation;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.canva.com/rest/v1/designs',
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});

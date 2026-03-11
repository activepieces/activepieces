import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { canvaAuth } from '../../lib/auth';
import { CANVA_BASE_URL } from '../../lib/common';

export const listDesigns = createAction({
  auth: canvaAuth,
  name: 'list_designs',
  displayName: 'List Designs',
  description: 'List designs in your Canva account.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Filter designs by title (optional).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of designs to return (1-100).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const params: Record<string, string> = {};
    if (context.propsValue.query) {
      params['query'] = context.propsValue.query;
    }
    if (context.propsValue.limit) {
      params['limit'] = String(context.propsValue.limit);
    }

    const response = await httpClient.sendRequest<unknown>({
      method: HttpMethod.GET,
      url: `${CANVA_BASE_URL}/designs`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      queryParams: params,
    });

    return response.body;
  },
});

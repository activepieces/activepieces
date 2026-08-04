import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { productListOutputSchema } from '../output-schemas';
export const stripeListProducts = createAction({
  name: 'list_products',
  auth: stripeAuth,
  displayName: 'List Products (Agent)',
  description: 'List Stripe products.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through products, newest first, optionally filtered by active status. Use to enumerate the catalog or resolve a product ID; for name matching use Search Products, or Get Product when you have the prod_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    active: Property.StaticDropdown({
      displayName: 'Active',
      description: 'Filter by active state.',
      required: false,
      options: {
        options: [
          { label: 'Active only', value: 'true' },
          { label: 'Inactive only', value: 'false' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: productListOutputSchema,
  async run(context) {
    const { active, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (active) queryParams['active'] = active;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/products`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

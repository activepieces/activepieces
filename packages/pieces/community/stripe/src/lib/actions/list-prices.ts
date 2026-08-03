import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { priceListOutputSchema } from '../output-schemas';
export const stripeListPrices = createAction({
  name: 'list_prices',
  auth: stripeAuth,
  displayName: 'List Prices (Agent)',
  description: 'List Stripe prices.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through prices, newest first, optionally filtered by product, active state, type (one_time/recurring), or currency. Use to enumerate prices or resolve a price ID; for query matching use Search Prices, or Get Price when you have the price_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    product: Property.ShortText({
      displayName: 'Product ID',
      description: 'Filter to prices for this product (prod_...).',
      required: false,
    }),
    active: Property.StaticDropdown({
      displayName: 'Active',
      required: false,
      options: {
        options: [
          { label: 'Active only', value: 'true' },
          { label: 'Inactive only', value: 'false' },
        ],
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          { label: 'One-time', value: 'one_time' },
          { label: 'Recurring', value: 'recurring' },
        ],
      },
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Three-letter ISO currency code (e.g., usd).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: priceListOutputSchema,
  async run(context) {
    const { product, active, type, currency, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (product) queryParams['product'] = product;
    if (active) queryParams['active'] = active;
    if (type) queryParams['type'] = type;
    if (currency) queryParams['currency'] = currency;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/prices`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

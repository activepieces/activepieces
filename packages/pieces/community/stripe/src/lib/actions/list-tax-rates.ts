import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListTaxRates = createAction({
  name: 'list_tax_rates',
  auth: stripeAuth,
  displayName: 'List Tax Rates (Agent)',
  description: 'List Stripe tax rates.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through tax rates, optionally filtered by active or inclusive flags. Use to enumerate tax rates or resolve a tax rate ID; use Get Tax Rate when you have the txr_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
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
    inclusive: Property.StaticDropdown({
      displayName: 'Inclusive',
      required: false,
      options: {
        options: [
          { label: 'Inclusive only', value: 'true' },
          { label: 'Exclusive only', value: 'false' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { active, inclusive, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (active) queryParams['active'] = active;
    if (inclusive) queryParams['inclusive'] = inclusive;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/tax_rates`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

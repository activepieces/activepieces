import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListPaymentLinks = createAction({
  name: 'list_payment_links',
  auth: stripeAuth,
  displayName: 'List Payment Links (Agent)',
  description: 'List Stripe payment links.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through payment links, optionally filtered by active state. Use to enumerate links or resolve a payment link ID; use Get Payment Link when you have the plink_ ID. Read-only and idempotent.',
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
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { active, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (active) queryParams['active'] = active;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/payment_links`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

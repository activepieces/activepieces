import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { taxRateOutputSchema } from '../output-schemas';
export const stripeGetTaxRate = createAction({
  name: 'get_tax_rate',
  auth: stripeAuth,
  displayName: 'Get Tax Rate (Agent)',
  description: 'Retrieve a tax rate by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single tax rate by its ID (e.g., txr_...). Use List Tax Rates to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    tax_rate_id: Property.ShortText({
      displayName: 'Tax Rate ID',
      description: 'The tax rate ID (e.g., txr_...). Obtain it from List Tax Rates.',
      required: true,
    }),
  },
  outputSchema: taxRateOutputSchema,
  async run(context) {
    const { tax_rate_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/tax_rates/${tax_rate_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});

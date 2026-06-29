import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreateTaxRate = createAction({
  name: 'create_tax_rate',
  auth: stripeAuth,
  displayName: 'Create Tax Rate (Agent)',
  description: 'Create a manual tax rate.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a manual Stripe tax rate (a fixed percentage with a display name and inclusive/exclusive flag), for applying to invoices or subscriptions. This is the manual tax-rate object, not Stripe Tax automation. Not idempotent: each call creates a new tax rate.',
    idempotent: false,
  },
  props: {
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'Name shown to customers (e.g., VAT).',
      required: true,
    }),
    percentage: Property.Number({
      displayName: 'Percentage',
      description: 'The tax rate percentage (e.g., 20 for 20%).',
      required: true,
    }),
    inclusive: Property.Checkbox({
      displayName: 'Inclusive',
      description: 'Whether the tax is included in the price.',
      required: true,
    }),
    jurisdiction: Property.ShortText({
      displayName: 'Jurisdiction',
      description: 'Optional jurisdiction text (e.g., UK).',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter ISO country code.',
      required: false,
    }),
  },
  async run(context) {
    const { display_name, percentage, inclusive, jurisdiction, country } =
      context.propsValue;

    const body: { [key: string]: unknown } = {
      display_name,
      percentage,
      inclusive,
    };
    if (jurisdiction) body.jurisdiction = jurisdiction;
    if (country) body.country = country;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/tax_rates`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { straleAuth } from '../auth';

export const executeCapability = createAction({
  name: 'execute_capability',
  auth: straleAuth,
  displayName: 'Execute Capability',
  description:
    'Run any Strale capability by slug. Performs verifications, validations, lookups, and data extraction. Returns structured output with quality score and data provenance. Five free capabilities work without an API key.',
  audience: 'both',
  aiMetadata: {
    description:
      'Run any Strale capability by slug, passing its required input fields (e.g. an IBAN to validate or a company to verify) and an optional spend cap. Choose this to actually perform a verification, validation, lookup, or data extraction after finding the slug via Search Capabilities. Not idempotent: each call executes the capability and may consume wallet balance; some capabilities are free while paid ones require an API key with sufficient funds.',
    idempotent: false,
  },
  props: {
    slug: Property.ShortText({
      displayName: 'Capability Slug',
      description:
        'The slug of the capability to run (e.g. "iban-validate", "sanctions-check"). Use Search to find slugs.',
      required: true,
    }),
    inputs: Property.Json({
      displayName: 'Input Parameters',
      description:
        'Input object matching the capability required fields (e.g. {"iban": "DE89370400440532013000"})',
      required: true,
      defaultValue: {},
    }),
    max_price_cents: Property.Number({
      displayName: 'Max Price (EUR cents)',
      description: 'Maximum price in EUR cents. Default: 200 (2.00 EUR).',
      required: false,
      defaultValue: 200,
    }),
  },
  async run(context) {
    const { slug, inputs, max_price_cents } = context.propsValue;

    const response = await httpClient.sendRequest({
      url: 'https://api.strale.io/v1/do',
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      body: {
        capability_slug: slug,
        inputs: typeof inputs === 'string' ? JSON.parse(inputs) : inputs,
        max_price_cents: max_price_cents ?? 200,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN as const,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});

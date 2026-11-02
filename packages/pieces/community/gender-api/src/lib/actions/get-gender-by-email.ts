import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { genderApiAuth } from '../common/auth';
import {
  genderApiClient,
  genderResultOutputSchema,
  normalizeGenderResult,
} from '../common/client';

export const getGenderByEmail = createAction({
  auth: genderApiAuth,
  name: 'getGenderByEmail',
  classification: 'READ',
  displayName: 'Get Gender by Email',
  description: 'Predict the gender of a person based on their email address',
  audience: 'both',
  aiMetadata: {
    description:
      'Predicts the likely gender of a person from an email address via the Gender API, which extracts the name from the local part (e.g. jane.doe@example.com). Use when you only have an email and no name; optionally pass an ISO 3166-1 alpha-2 country code and/or locale. Costs 1 credit. Read-only lookup that is safe to repeat.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to query (e.g., "jane.doe@example.com")',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country code to improve accuracy (e.g., "US", "DE")',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Browser locale for localization (e.g., "en-US", "de-DE")',
      required: false,
    }),
  },
  outputSchema: genderResultOutputSchema,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { email: propsValue.email };
    if (propsValue.country_code) {
      body['country'] = propsValue.country_code.trim().toUpperCase();
    }
    if (propsValue.locale) {
      body['locale'] = propsValue.locale.trim();
    }
    const response = await genderApiClient.request<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/gender',
      body,
    });
    return normalizeGenderResult(response);
  },
});

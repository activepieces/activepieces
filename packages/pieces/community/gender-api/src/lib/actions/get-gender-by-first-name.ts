import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { genderApiAuth } from '../common/auth';
import {
  genderApiClient,
  genderResultOutputSchema,
  normalizeGenderResult,
} from '../common/client';

export const getGenderByFirstName = createAction({
  auth: genderApiAuth,
  name: 'getGenderByFirstName',
  classification: 'READ',
  displayName: 'Get Gender by First Name',
  description: 'Predict the gender of a person based on their first name',
  audience: 'both',
  aiMetadata: {
    description:
      'Predicts the likely gender of a person from a single first name via the Gender API. Use when you have only a given name (not a full name); optionally pass an ISO 3166-1 alpha-2 country code and/or locale to improve accuracy for region-specific names. Costs 1 credit. Read-only lookup that is safe to repeat.',
    idempotent: true,
  },
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name to query',
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
    const body: Record<string, unknown> = { first_name: propsValue.first_name };
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

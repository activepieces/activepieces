import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { genderApiAuth } from '../common/auth';
import { genderApiCommon } from '../common/client';

export const getGenderByFullName = createAction({
  auth: genderApiAuth,
  name: 'getGenderByFullName',
  classification: 'READ',
  displayName: 'Get Gender by Full Name',
  description: 'Predict the gender of a person based on their full name',
  audience: 'both',
  aiMetadata: {
    description:
      'Predicts the likely gender of a person from a full name (first and last) via the Gender API, which splits out the first and last name itself. Use when you have the complete name rather than only a given name; optionally pass an ISO 3166-1 alpha-2 country code and/or locale to improve accuracy. Costs 1 credit. Read-only lookup that is safe to repeat.',
    idempotent: true,
  },
  props: {
    full_name: Property.ShortText({
      displayName: 'Full Name',
      description: 'The full name (first and last name) to query',
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
  outputSchema: genderApiCommon.genderResultWithRawOutputSchema,
  async run({ auth, propsValue }) {
    const body = genderApiCommon.buildLookupBody({
      key: 'full_name',
      value: propsValue.full_name,
      countryCode: propsValue.country_code,
      locale: propsValue.locale,
    });
    const response = await genderApiCommon.request<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/gender',
      body,
    });
    return genderApiCommon.normalizeGenderResultKeepingRaw(response);
  },
});

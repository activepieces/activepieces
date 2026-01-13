import { createAction, Property } from '@activepieces/pieces-framework';
import { genderApiAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getGenderByFullName = createAction({
  auth: genderApiAuth,
  name: 'getGenderByFullName',
  displayName: 'Get Gender by Full Name',
  description: 'Predict the gender of a person based on their full name',
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
  async run(context) {
    const payload: any = {
      full_name: context.propsValue.full_name,
    };

    if (context.propsValue.country_code) {
      payload.country_code = context.propsValue.country_code;
    }

    if (context.propsValue.locale) {
      payload.locale = context.propsValue.locale;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://gender-api.com/v2/gender',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.auth.secret_text}`,
      },
      body: payload,
    });

    return response.body;
  },
});

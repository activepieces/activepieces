import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipGetCountryOutputSchema } from '../../../output-schemas';

export const getCountryAction = createAction({
  auth: greipAuth,
  name: 'greip_get_country',
  outputSchema: greipGetCountryOutputSchema,
  displayName: 'Get Country',
  description: 'Get details about a country from its two-letter code, optionally with its languages, flag and currency.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Get geographic details for a country by its ISO 3166-1 alpha-2 code (e.g. GB), optionally adding its languages, flag and currency. Look Up IP and Score Phone take or return country codes in this format.',
    idempotent: true,
  },
  props: {
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country code, e.g. GB or US.',
      required: true,
    }),
    modules: Property.StaticMultiSelectDropdown({
      displayName: 'Extra Modules',
      description: 'Optional data to add to the response. Basic geo data is always included.',
      required: false,
      options: {
        options: [
          { label: 'Language', value: 'language' },
          { label: 'Flag', value: 'flag' },
          { label: 'Currency', value: 'currency' },
        ],
      },
    }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { countryCode, modules, userId } = context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/lookup/countries/${encodeURIComponent(countryCode)}`,
      query: {
        ...(modules && modules.length > 0 ? { params: modules.join(',') } : {}),
        ...(userId ? { user_id: userId } : {}),
      },
    });
  },
});

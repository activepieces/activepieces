import { createAction, Property } from '@activepieces/pieces-framework';
import { serpapiCommon } from '../common/common';
import { serpapiAuth } from '../../index';
import { countryDropdown, languageDropdown } from '../common/utils';

export const googleSearch = createAction({
  auth: serpapiAuth,
  name: 'google_search',
  displayName: 'Google Search',
  description: 'Retrieve organic search results for a specific keyword to monitor SEO ranking',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The search query to look up',
      required: true,
    }),
    country: countryDropdown,
    language: languageDropdown,
    num: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of results to return (default: 10)',
      required: false,
    }),
    start: Property.Number({
      displayName: 'Start Position',
      description: 'Starting position for the search results (for pagination)',
      required: false,
    }),
    safe: Property.Checkbox({
      displayName: 'Safe Search',
      description: 'Enable safe search filtering',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { query, country, language, num, start, safe } = propsValue;

    const params: Record<string, any> = {
      q: query,
      engine: 'google',
    };

    // Only add optional parameters if they have values
    if (country) params['gl'] = country;
    if (language) params['hl'] = language;
    if (num) params['num'] = num;
    if (start) params['start'] = start;
    if (safe !== undefined) params['safe'] = safe ? 'active' : 'off';

    return await serpapiCommon.makeRequest(auth, params);
  },
});

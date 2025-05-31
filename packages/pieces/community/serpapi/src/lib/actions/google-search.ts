import { createAction, Property } from '@activepieces/pieces-framework';
import { serpapiCommon } from '../common';
import { serpapiAuth } from '../../index';


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
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country to use for the search (e.g., us, uk, ca)',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language to use for the search (e.g., en, es, fr)',
      required: false,
    }),
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

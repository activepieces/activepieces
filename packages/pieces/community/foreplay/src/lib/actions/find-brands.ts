import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ForeplayAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findBrands = createAction({
  auth: ForeplayAuth,
  name: 'find_brands',
  displayName: 'Find Brands',
  description: 'Search for brands by name or by domain. Tries multiple endpoints to handle differences in plans or versions.',
  props: {
    searchMode: Property.StaticDropdown({
      displayName: 'Search Mode',
      description: 'Choose how you want to search brands',
      required: true,
      defaultValue: 'name',
      options: {
        options: [
          { label: 'By Name', value: 'name' },
          { label: 'By Domain', value: 'domain' },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Brand Name',
      description: 'Search input for brand name (required if Search Mode = Name)',
      required: false,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Domain to search for brands (required if Search Mode = Domain, e.g. abc.com)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Results Limit',
      description: 'Number of brands to return (max maybe limited by API)',
      required: false,
      defaultValue: 10,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Sort results by relevance or ranking (if supported)',
      required: false,
      options: {
        options: [
          { label: 'Most Ranked', value: 'most_ranked' },
          { label: 'Least Ranked', value: 'least_ranked' },
        ],
      },
      defaultValue: 'most_ranked',
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { searchMode, name, domain, limit, order } = propsValue;

    if (searchMode === 'name' && !name) {
      throw new Error('Brand Name is required when Search Mode = Name');
    }
    if (searchMode === 'domain' && !domain) {
      throw new Error('Domain is required when Search Mode = Domain');
    }

    // Try name search first
    if (searchMode === 'name') {
      try {
        const resp = await makeRequest(
          apiKey,
          HttpMethod.GET,
          `/discovery/brands?query=${encodeURIComponent(name!)}&limit=${limit}`
        );
        if (resp?.data && Array.isArray(resp.data) && resp.data.length > 0) {
          return resp.data;
        }
      } catch (e) {
        // console.warn, fallback
      }

      try {
        const resp2 = await makeRequest(
          apiKey,
          HttpMethod.GET,
          `/brand/getBrandsByDomain?domain=${encodeURIComponent(name!)}&limit=${limit}`  
        );
        if (resp2?.data && Array.isArray(resp2.data) && resp2.data.length > 0) {
          return resp2.data;
        }
      } catch (e) {
        // console.warn
      }

      return [];
    }

    // Domain search
    if (searchMode === 'domain') {
      try {
        const resp = await makeRequest(
          apiKey,
          HttpMethod.GET,
          `/brand/getBrandsByDomain?domain=${encodeURIComponent(domain!)}&limit=${limit}&order=${order}`
        );
        if (resp?.data && Array.isArray(resp.data)) {
          return resp.data;
        }
      } catch (e) {
        // fallback
      }

      // Another possible path
      try {
        const resp2 = await makeRequest(
          apiKey,
          HttpMethod.GET,
          `/discovery/brands?query=${encodeURIComponent(domain!)}&limit=${limit}`
        );
        if (resp2?.data && Array.isArray(resp2.data)) {
          return resp2.data;
        }
      } catch (e) {
        // fallback
      }

      return [];
    }

    return [];
  },
});

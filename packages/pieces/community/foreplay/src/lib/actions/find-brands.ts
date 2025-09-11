import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ForeplayAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findBrands = createAction({
  auth: ForeplayAuth,
  name: 'findBrands',
  displayName: 'Find Brands',
  description: 'Search brands by name, domain, industry, or other filters.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Brand domain to search for (e.g., nike.com)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Brand Name',
      description: 'Search brands by name',
      required: false,
    }),
    industry: Property.StaticDropdown({
      displayName: 'Industry',
      description: 'Filter brands by industry',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'E-commerce', value: 'ecommerce' },
          { label: 'Technology', value: 'technology' },
          { label: 'Finance', value: 'finance' },
          { label: 'Healthcare', value: 'healthcare' },
          { label: 'Education', value: 'education' },
          { label: 'Retail', value: 'retail' },
          { label: 'Travel', value: 'travel' },
          { label: 'Food & Beverage', value: 'food_beverage' },
          { label: 'Entertainment', value: 'entertainment' },
          { label: 'Fashion', value: 'fashion' },
        ],
      },
    }),
    minAds: Property.Number({
      displayName: 'Minimum Ads Count',
      description: 'Filter brands with at least this many ads',
      required: false,
    }),
    maxAds: Property.Number({
      displayName: 'Maximum Ads Count',
      description: 'Filter brands with at most this many ads',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Results Limit',
      description: 'Maximum number of brands to return',
      required: false,
      defaultValue: 50,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort results by',
      required: false,
      options: {
        options: [
          { label: 'Name (A-Z)', value: 'name_asc' },
          { label: 'Name (Z-A)', value: 'name_desc' },
          { label: 'Ads Count (High to Low)', value: 'ads_count_desc' },
          { label: 'Ads Count (Low to High)', value: 'ads_count_asc' },
          { label: 'Recently Updated', value: 'updated_desc' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { domain, name, industry, minAds, maxAds, limit, sortBy } =
      propsValue;

    if (!domain && !name && !industry) {
      throw new Error(
        'At least one search parameter (Domain, Brand Name, or Industry) is required'
      );
    }

    const queryParams = new URLSearchParams();

    if (domain) {
      queryParams.append('domain', domain);
    }

    if (name) {
      queryParams.append('name', name);
    }

    if (industry) {
      queryParams.append('industry', industry);
    }

    if (minAds !== undefined && minAds !== null) {
      queryParams.append('minAds', minAds.toString());
    }

    if (maxAds !== undefined && maxAds !== null) {
      queryParams.append('maxAds', maxAds.toString());
    }

    if (limit !== undefined && limit !== null) {
      queryParams.append('limit', limit.toString());
    }

    if (sortBy) {
      queryParams.append('sort', sortBy);
    }

    let endpoint = '/brand/getBrandsByDomain';

    if (name && !domain) {
      endpoint = '/brand/search';
    } else if (industry && !domain && !name) {
      endpoint = '/brand/filter';
    }

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `${endpoint}?${queryParams.toString()}`
    );

    return response;
  },
});

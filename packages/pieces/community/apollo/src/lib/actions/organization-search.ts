import { apolloAuth } from '../../';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const organizationSearch = createAction({
  auth: apolloAuth,
  name: 'organizationSearch',
  displayName: 'Organization Search',
  description:
    'Search for companies in the Apollo database with various filters',
  props: {
    q_organization_name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Search by organization name',
      required: false,
    }),
    organization_locations: Property.Array({
      displayName: 'Organization Locations',
      description: 'Filter by locations (e.g., texas, tokyo)',
      required: false,
    }),
    organization_not_locations: Property.Array({
      displayName: 'Exclude Locations',
      description: 'Exclude specific locations (e.g., minnesota)',
      required: false,
    }),
    organization_num_employees_ranges: Property.Array({
      displayName: 'Employee Count Ranges',
      description: 'Filter by employee count ranges (e.g., "1,10", "250,500")',
      required: false,
    }),
    organization_ids: Property.Array({
      displayName: 'Organization IDs',
      description: 'Filter by specific organization IDs',
      required: false,
    }),
    q_organization_domains: Property.Array({
      displayName: 'Domains',
      description: 'Filter by organization domains',
      required: false,
    }),
    organization_industry_tag_ids: Property.Array({
      displayName: 'Industry Tag IDs',
      description: 'Filter by industry tag IDs',
      required: false,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store the response in the project store for future use.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ propsValue, auth, store }) {
    const queryParams = new URLSearchParams();

    if (propsValue.q_organization_name) {
      queryParams.append('q_organization_name', propsValue.q_organization_name);
    }
    if (
      propsValue.organization_locations &&
      propsValue.organization_locations.length > 0
    ) {
      propsValue.organization_locations.forEach((location: unknown) => {
        queryParams.append('organization_locations[]', location as string);
      });
    }

    if (
      propsValue.organization_not_locations &&
      propsValue.organization_not_locations.length > 0
    ) {
      propsValue.organization_not_locations.forEach((location: unknown) => {
        queryParams.append('organization_not_locations[]', location as string);
      });
    }

    if (
      propsValue.organization_num_employees_ranges &&
      propsValue.organization_num_employees_ranges.length > 0
    ) {
      propsValue.organization_num_employees_ranges.forEach((range: unknown) => {
        queryParams.append(
          'organization_num_employees_ranges[]',
          range as string
        );
      });
    }
    if (propsValue.organization_ids && propsValue.organization_ids.length > 0) {
      propsValue.organization_ids.forEach((id: unknown) => {
        queryParams.append('organization_ids[]', id as string);
      });
    }

    if (
      propsValue.q_organization_domains &&
      propsValue.q_organization_domains.length > 0
    ) {
      propsValue.q_organization_domains.forEach((domain: unknown) => {
        queryParams.append('q_organization_domains[]', domain as string);
      });
    }

    if (
      propsValue.organization_industry_tag_ids &&
      propsValue.organization_industry_tag_ids.length > 0
    ) {
      propsValue.organization_industry_tag_ids.forEach((tagId: unknown) => {
        queryParams.append('organization_industry_tag_ids[]', tagId as string);
      });
    }

    const cacheKey = `_apollo_org_search_${queryParams.toString()}`;

    if (propsValue.cacheResponse) {
      const cachedResult = await store.get(cacheKey, StoreScope.PROJECT);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const result = await httpClient.sendRequest<{
      organizations: Record<string, unknown>[];
      pagination: Record<string, unknown>;
    }>({
      method: HttpMethod.POST,
      url: `https://api.apollo.io/api/v1/mixed_companies/search?${queryParams.toString()}`,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': `${auth.secret_text}`,
      },
    });

    if (propsValue.cacheResponse) {
      await store.put(cacheKey, result.body, StoreScope.PROJECT);
    }

    return result.body;
  },
});

import { Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { QueryValue, apiKeyOf, buildQuery } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloRequests } from '../common/requests';

export const organizationSearch = createAction({
  auth: apolloAuth,
  name: 'organizationSearch',
  classification: 'SEARCH',
  displayName: 'Organization Search',
  description: 'Search for companies in the Apollo database with various filters. Uses 1 Apollo credit per page.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches the Apollo company database by name, location, headcount, domain and industry, one page at a time, and returns the raw Apollo response. Uses 1 Apollo credit per page.',
    idempotent: true,
  },
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
      description: 'Filter by organization domains, without "www." (e.g., apollo.io). Up to 1,000.',
      required: false,
    }),
    organization_industry_tag_ids: Property.Array({
      displayName: 'Industry Tag IDs',
      description: 'Filter by industry tag IDs',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1 (default 1). Each page uses 1 credit.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Results per page, 1-100 (Apollo default 10 when empty).',
      required: false,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store the response in the project store for future use.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: apolloOutputSchemas.rawOrganizationSearch,
  async run({ propsValue, auth, store }) {
    const domains = apolloInputs.stringList(propsValue.q_organization_domains);
    const query: Record<string, QueryValue> = {
      q_organization_name: apolloInputs.optionalText(propsValue.q_organization_name),
      'organization_locations[]': apolloInputs.stringList(propsValue.organization_locations),
      'organization_not_locations[]': apolloInputs.stringList(propsValue.organization_not_locations),
      'organization_num_employees_ranges[]': apolloInputs.stringList(propsValue.organization_num_employees_ranges),
      'organization_ids[]': apolloInputs.stringList(propsValue.organization_ids),
      'q_organization_domains[]': domains,
      'q_organization_domains_list[]': domains,
      'organization_industry_tag_ids[]': apolloInputs.stringList(propsValue.organization_industry_tag_ids),
      page: apolloInputs.optionalInteger({ value: propsValue.page, label: 'Page', min: 1, max: 500 }),
      per_page: apolloInputs.optionalInteger({ value: propsValue.per_page, label: 'Results Per Page', min: 1, max: 100 }),
    };
    const cacheKey = `_apollo_org_search_${buildQuery(query).slice(1)}`;
    if (propsValue.cacheResponse) {
      const cached = await store.get<unknown>(cacheKey, StoreScope.PROJECT);
      if (cached) {
        return cached;
      }
    }
    const body = await apolloRequests.searchOrganizations({ apiKey: apiKeyOf(auth), query });
    if (propsValue.cacheResponse) {
      await store.put(cacheKey, body, StoreScope.PROJECT);
    }
    return body;
  },
});

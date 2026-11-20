import { apolloAuth } from '../auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  MarkdownVariant,
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const organizationSearch = createAction({
  auth: apolloAuth,
  name: 'organizationSearch',
  classification: 'SEARCH',
  displayName: 'Organization Search',
  description: 'Find companies in Apollo by name, location, size and more.',
  audience: 'both',
  aiMetadata: {
    description: 'Search the Apollo database for companies using filters such as name, location, employee-count range, domain, and industry tags. Use to discover organizations or to resolve a company to its Apollo organization ID for downstream actions. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'company',
      display: 'section',
      label: 'Company',
      icon: 'tag',
      props: [
        'filters_info',
        'q_organization_name',
        'q_organization_domains',
        'organization_ids',
        'organization_industry_tag_ids',
      ],
    },
    {
      key: 'location_size',
      display: 'section',
      label: 'Location and Size',
      icon: 'location',
      props: [
        'organization_locations',
        'organization_not_locations',
        'organization_num_employees_ranges',
      ],
    },
  ],
  props: {
    filters_info: Property.MarkDown({
      value: 'Every filter on this step is optional. Empty filters are ignored.',
      variant: MarkdownVariant.INFO,
    }),
    q_organization_name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Matches part of the company name.',
      placeholder: 'Apollo',
      required: false,
    }),
    organization_locations: Property.Array({
      displayName: 'Organization Locations',
      description: 'Headquarters locations, such as texas or tokyo.',
      required: false,
    }),
    organization_not_locations: Property.Array({
      displayName: 'Exclude Locations',
      description: 'Headquarters locations to leave out, such as minnesota.',
      required: false,
    }),
    organization_num_employees_ranges: Property.Array({
      displayName: 'Employee Count Ranges',
      description: 'Ranges as min,max, such as 1,10 or 250,500.',
      required: false,
    }),
    organization_ids: Property.Array({
      displayName: 'Organization IDs',
      description: 'Apollo organization IDs to include.',
      required: false,
    }),
    q_organization_domains: Property.Array({
      displayName: 'Organization Domains',
      description: 'Company website domains, such as apollo.io.',
      required: false,
    }),
    organization_industry_tag_ids: Property.Array({
      displayName: 'Industry Tag IDs',
      description: 'Apollo industry tag IDs to include.',
      required: false,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description:
        'Reuse a saved result for the same input. Saved results never expire.',
      required: false,
      advanced: true,
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

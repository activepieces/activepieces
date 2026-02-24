import { apolloAuth } from '../../';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const peopleSearch = createAction({
  auth: apolloAuth,
  name: 'peopleSearch',
  displayName: 'People Search',
  description:
    'Search for people in the Apollo database (does not return email/phone, use enrichment for that)',
  props: {
    q_keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Search keywords for people',
      required: false,
    }),
    person_titles: Property.Array({
      displayName: 'Person Titles',
      description: 'Filter by job titles (e.g., "CEO", "Sales Manager")',
      required: false,
    }),
    person_locations: Property.Array({
      displayName: 'Person Locations',
      description: 'Filter by person locations',
      required: false,
    }),
    person_seniorities: Property.Array({
      displayName: 'Person Seniorities',
      description:
        'Filter by seniority levels (e.g., "senior", "manager", "director")',
      required: false,
    }),
    organization_ids: Property.Array({
      displayName: 'Organization IDs',
      description: 'Filter by specific organization IDs',
      required: false,
    }),
    organization_num_employees_ranges: Property.Array({
      displayName: 'Organization Employee Ranges',
      description:
        'Filter by organization employee count ranges (e.g., "1,10", "250,500")',
      required: false,
    }),
    q_organization_domains: Property.Array({
      displayName: 'Organization Domains',
      description: 'Filter by organization domains',
      required: false,
    }),
    organization_locations: Property.Array({
      displayName: 'Organization Locations',
      description: 'Filter by organization locations',
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

    if (propsValue.q_keywords) {
      queryParams.append('q_keywords', propsValue.q_keywords);
    }

    if (propsValue.person_titles && propsValue.person_titles.length > 0) {
      propsValue.person_titles.forEach((title: unknown) => {
        queryParams.append('person_titles[]', title as string);
      });
    }
    if (propsValue.person_locations && propsValue.person_locations.length > 0) {
      propsValue.person_locations.forEach((location: unknown) => {
        queryParams.append('person_locations[]', location as string);
      });
    }

    if (
      propsValue.person_seniorities &&
      propsValue.person_seniorities.length > 0
    ) {
      propsValue.person_seniorities.forEach((seniority: unknown) => {
        queryParams.append('person_seniorities[]', seniority as string);
      });
    }
    if (propsValue.organization_ids && propsValue.organization_ids.length > 0) {
      propsValue.organization_ids.forEach((id: unknown) => {
        queryParams.append('organization_ids[]', id as string);
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

    if (
      propsValue.q_organization_domains &&
      propsValue.q_organization_domains.length > 0
    ) {
      propsValue.q_organization_domains.forEach((domain: unknown) => {
        queryParams.append('q_organization_domains[]', domain as string);
      });
    }

    if (
      propsValue.organization_locations &&
      propsValue.organization_locations.length > 0
    ) {
      propsValue.organization_locations.forEach((location: unknown) => {
        queryParams.append('organization_locations[]', location as string);
      });
    }

    const cacheKey = `_apollo_people_search_${queryParams.toString()}`;

    if (propsValue.cacheResponse) {
      const cachedResult = await store.get(cacheKey, StoreScope.PROJECT);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const result = await httpClient.sendRequest<{
      people: Record<string, unknown>[];
      pagination: Record<string, unknown>;
    }>({
      method: HttpMethod.POST,
      url: `https://api.apollo.io/api/v1/mixed_people/api_search?${queryParams.toString()}`,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': `${auth.secret_text}`,
      },
    });

    const response = {
      people: result.body.people || [],
      pagination: result.body.pagination || {},
    };

    if (propsValue.cacheResponse) {
      await store.put(cacheKey, response, StoreScope.PROJECT);
    }

    return response;
  },
});

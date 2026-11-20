import { apolloAuth } from '../auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  MarkdownVariant,
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const peopleSearch = createAction({
  auth: apolloAuth,
  name: 'peopleSearch',
  classification: 'SEARCH',
  displayName: 'People Search',
  description: 'Find people in Apollo. Results have no email or phone.',
  audience: 'both',
  aiMetadata: {
    description: 'Search the Apollo database for people using filters such as keywords, job titles, seniority, location, and their organization (domain, location, employee-count range). Use to find prospects matching criteria; note the results do not include email or phone, so use Match Person enrichment for contact details. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'person',
      display: 'section',
      label: 'Person',
      icon: 'user',
      props: [
        'results_info',
        'q_keywords',
        'person_titles',
        'person_seniorities',
        'person_locations',
      ],
    },
    {
      key: 'company',
      display: 'section',
      label: 'Company',
      icon: 'tag',
      props: [
        'organization_ids',
        'q_organization_domains',
        'organization_num_employees_ranges',
        'organization_locations',
      ],
    },
  ],
  props: {
    results_info: Property.MarkDown({
      value:
        "Results have no email or phone. Use **Match Person** to look up a person's details.",
      variant: MarkdownVariant.INFO,
    }),
    q_keywords: Property.ShortText({
      displayName: 'Keywords',
      description: "Words to match anywhere in the person's profile.",
      placeholder: 'marketing',
      required: false,
    }),
    person_titles: Property.Array({
      displayName: 'Job Titles',
      description: 'Job titles to match, such as CEO or Sales Manager.',
      required: false,
    }),
    person_locations: Property.Array({
      displayName: 'Locations',
      description: 'Where the person lives, such as california or london.',
      required: false,
    }),
    person_seniorities: Property.Array({
      displayName: 'Seniorities',
      description: 'Seniority levels, such as senior, manager or director.',
      required: false,
    }),
    organization_ids: Property.Array({
      displayName: 'Organization IDs',
      description: 'Apollo IDs of the companies they work at.',
      required: false,
    }),
    organization_num_employees_ranges: Property.Array({
      displayName: 'Employee Count Ranges',
      description: 'Company size ranges as min,max, such as 1,10 or 250,500.',
      required: false,
    }),
    q_organization_domains: Property.Array({
      displayName: 'Organization Domains',
      description: 'Domains of the companies they work at, such as apollo.io.',
      required: false,
    }),
    organization_locations: Property.Array({
      displayName: 'Organization Locations',
      description: 'Headquarters locations of their company.',
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

import { Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { QueryValue, apiKeyOf, buildQuery, recordsOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloRequests } from '../common/requests';

export const peopleSearch = createAction({
  auth: apolloAuth,
  name: 'peopleSearch',
  classification: 'SEARCH',
  displayName: 'People Search',
  description: 'Search for people in the Apollo database (does not return email/phone, use enrichment for that). Uses no credits.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches the Apollo people database by keywords, titles, seniority, location and employer filters, one page at a time. Results have no email or phone; use Match Person to enrich. Uses no credits.',
    idempotent: true,
  },
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
      description: 'Filter by seniority levels (e.g., "senior", "manager", "director")',
      required: false,
    }),
    organization_ids: Property.Array({
      displayName: 'Organization IDs',
      description: 'Filter by specific organization IDs',
      required: false,
    }),
    organization_num_employees_ranges: Property.Array({
      displayName: 'Organization Employee Ranges',
      description: 'Filter by organization employee count ranges (e.g., "1,10", "250,500")',
      required: false,
    }),
    q_organization_domains: Property.Array({
      displayName: 'Organization Domains',
      description: 'Filter by employer domains, without "www." (e.g., apollo.io). Up to 1,000.',
      required: false,
    }),
    organization_locations: Property.Array({
      displayName: 'Organization Locations',
      description: 'Filter by organization locations',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1 (default 1). Apollo returns at most 500 pages.',
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
  outputSchema: apolloOutputSchemas.rawPeopleSearch,
  async run({ propsValue, auth, store }) {
    const page = apolloInputs.optionalInteger({ value: propsValue.page, label: 'Page', min: 1, max: 500 });
    const perPage = apolloInputs.optionalInteger({ value: propsValue.per_page, label: 'Results Per Page', min: 1, max: 100 });
    const domains = apolloInputs.stringList(propsValue.q_organization_domains);
    const query: Record<string, QueryValue> = {
      q_keywords: apolloInputs.optionalText(propsValue.q_keywords),
      'person_titles[]': apolloInputs.stringList(propsValue.person_titles),
      'person_locations[]': apolloInputs.stringList(propsValue.person_locations),
      'person_seniorities[]': apolloInputs.stringList(propsValue.person_seniorities),
      'organization_ids[]': apolloInputs.stringList(propsValue.organization_ids),
      'organization_num_employees_ranges[]': apolloInputs.stringList(propsValue.organization_num_employees_ranges),
      'q_organization_domains[]': domains,
      'q_organization_domains_list[]': domains,
      'organization_locations[]': apolloInputs.stringList(propsValue.organization_locations),
      page,
      per_page: perPage,
    };
    const cacheKey = `_apollo_people_search_${buildQuery(query).slice(1)}`;
    if (propsValue.cacheResponse) {
      const cached = await store.get<unknown>(cacheKey, StoreScope.PROJECT);
      if (cached) {
        return cached;
      }
    }
    const body = await apolloRequests.searchPeople({ apiKey: apiKeyOf(auth), query });
    const people = recordsOf(body['people']);
    const totalEntries = typeof body['total_entries'] === 'number' ? body['total_entries'] : null;
    const response = {
      people,
      pagination: { page: page ?? 1, per_page: perPage ?? null, total_entries: totalEntries },
      total_entries: totalEntries,
    };
    if (propsValue.cacheResponse) {
      await store.put(cacheKey, response, StoreScope.PROJECT);
    }
    return response;
  },
});

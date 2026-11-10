import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiSearchPeopleAction = createAction({
  auth: apolloAuth,
  name: 'ai_search_people',
  classification: 'SEARCH',
  displayName: 'Search People',
  description: 'Search the Apollo people database.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Apollo\'s global people database (net-new prospects, not your saved contacts) by keywords, name, job titles, seniority, location and employer filters, one page at a time. Results carry an Apollo person ID, first name, title and employer but no email or phone; pass the ID to Enrich Person for those. Uses no credits. To search contacts already saved in your CRM use Search Contacts.',
    idempotent: true,
  },
  props: {
    keywords: aiProps.text({ displayName: 'Keywords', description: 'Free-text keywords to match.', required: false }),
    person_name: aiProps.text({ displayName: 'Person Name', description: 'Name of the person; results contain every word given.', required: false }),
    person_titles: aiProps.textList({ displayName: 'Job Titles', description: 'Job titles to match (any one), e.g. "sales manager".', required: false }),
    person_seniorities: aiProps.textList({ displayName: 'Seniorities', description: 'Seniority levels: owner, founder, c_suite, partner, vp, head, director, manager, senior, entry, intern.', required: false }),
    person_locations: aiProps.textList({ displayName: 'Person Locations', description: 'Where the people live: cities, US states or countries.', required: false }),
    organization_locations: aiProps.textList({ displayName: 'Employer Locations', description: 'Headquarters locations of the current employer.', required: false }),
    organization_domains: aiProps.textList({ displayName: 'Employer Domains', description: 'Employer domains without "www.", e.g. apollo.io (up to 1,000).', required: false }),
    organization_ids: aiProps.textList({ displayName: 'Employer Organization IDs', description: 'Apollo organization IDs from Search Organizations (field organization_id).', required: false }),
    organization_num_employees_ranges: aiProps.textList({ displayName: 'Employer Headcount Ranges', description: 'Ranges as "min,max", e.g. "1,10" or "250,500".', required: false }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.peopleSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const body = await apolloRequests.searchPeople({
      apiKey: apiKeyOf(auth),
      query: {
        q_keywords: apolloInputs.optionalText(propsValue.keywords),
        q_person_name: apolloInputs.optionalText(propsValue.person_name),
        'person_titles[]': apolloInputs.stringList(propsValue.person_titles),
        'person_seniorities[]': apolloInputs.stringList(propsValue.person_seniorities),
        'person_locations[]': apolloInputs.stringList(propsValue.person_locations),
        'organization_locations[]': apolloInputs.stringList(propsValue.organization_locations),
        'q_organization_domains_list[]': apolloInputs.stringList(propsValue.organization_domains),
        'organization_ids[]': apolloInputs.stringList(propsValue.organization_ids),
        'organization_num_employees_ranges[]': apolloInputs.stringList(propsValue.organization_num_employees_ranges),
        page,
        per_page: perPage,
      },
    });
    const people = recordsOf(body['people']).map((person) => apolloMappers.personSearchResult(person));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: people.length }), people };
  },
});

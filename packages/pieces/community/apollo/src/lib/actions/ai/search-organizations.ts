import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiSearchOrganizationsAction = createAction({
  auth: apolloAuth,
  name: 'ai_search_organizations',
  classification: 'SEARCH',
  displayName: 'Search Organizations',
  description: 'Search the Apollo company database.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Apollo\'s global company database by name, domain, location, headcount and keyword tags, one page at a time, returning organization_id (use with Enrich Organization, List Organization Job Postings, Search News Articles) and account_id when the company is already saved. Costs 1 Apollo credit per page, so narrow filters first. To search companies saved in your CRM use Search Accounts.',
    idempotent: true,
  },
  props: {
    name: aiProps.text({ displayName: 'Company Name', description: 'Company name to match.', required: false }),
    domains: aiProps.textList({ displayName: 'Domains', description: 'Company domains without "www.", e.g. apollo.io (up to 1,000).', required: false }),
    locations: aiProps.textList({ displayName: 'Headquarters Locations', description: 'Cities, US states or countries.', required: false }),
    excluded_locations: aiProps.textList({ displayName: 'Excluded Locations', description: 'Headquarters locations to leave out.', required: false }),
    employee_ranges: aiProps.textList({ displayName: 'Headcount Ranges', description: 'Ranges as "min,max", e.g. "1,10" or "250,500".', required: false }),
    keyword_tags: aiProps.textList({ displayName: 'Keyword Tags', description: 'Industry keywords, e.g. "mining".', required: false }),
    organization_ids: aiProps.textList({ displayName: 'Organization IDs', description: 'Restrict to these Apollo organization IDs.', required: false }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.organizationSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const body = await apolloRequests.searchOrganizations({
      apiKey: apiKeyOf(auth),
      query: {
        q_organization_name: apolloInputs.optionalText(propsValue.name),
        'q_organization_domains_list[]': apolloInputs.stringList(propsValue.domains),
        'organization_locations[]': apolloInputs.stringList(propsValue.locations),
        'organization_not_locations[]': apolloInputs.stringList(propsValue.excluded_locations),
        'organization_num_employees_ranges[]': apolloInputs.stringList(propsValue.employee_ranges),
        'q_organization_keyword_tags[]': apolloInputs.stringList(propsValue.keyword_tags),
        'organization_ids[]': apolloInputs.stringList(propsValue.organization_ids),
        page,
        per_page: perPage,
      },
    });
    const organizations = [
      ...recordsOf(body['accounts']).map((record) => apolloMappers.organizationSearchResult({ record, isAccount: true })),
      ...recordsOf(body['organizations']).map((record) => apolloMappers.organizationSearchResult({ record, isAccount: false })),
    ];
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: organizations.length }), organizations };
  },
});

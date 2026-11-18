import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkOutputSchemas } from '../../output-schemas';

export const searchCompanies = createAction({
  auth: folkAuth,
  name: 'search_companies',
  displayName: 'Search Companies',
  description: 'Find companies in Folk by name, email, URL, industry, group or creation date.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: folkOutputSchemas.companies,
  aiMetadata: {
    description:
      'Searches Folk companies and returns one page (up to 100) with hasMore and nextCursor; pass nextCursor back as Cursor to read further pages. Text filters are contains-matches. Extra Filters accept any Folk company filter, e.g. {"field": "customFieldValues.grp_....Status", "operator": "in", "value": "Customer"}. With no filters it lists every company. count is the number of items on this page, not a total. Read-only.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name Contains', description: 'Text the company name contains.', required: false }),
    email: Property.ShortText({ displayName: 'Email Contains', description: 'Text an email contains.', required: false }),
    url: Property.ShortText({ displayName: 'URL Contains', description: 'Text a website URL contains, e.g. "acme.com".', required: false }),
    industry: Property.ShortText({ displayName: 'Industry Contains', description: 'Text the industry contains.', required: false }),
    groupId: Property.ShortText({ displayName: 'Group ID', description: 'Only companies in this group (grp_...).', required: false }),
    createdAfter: Property.ShortText({ displayName: 'Created After', description: 'YYYY-MM-DD; companies created after this day.', required: false }),
    createdBefore: Property.ShortText({ displayName: 'Created Before', description: 'YYYY-MM-DD; companies created before this day.', required: false }),
    extraFilters: folkAi.extraFiltersProp({ example: '[{"field": "employeeRange", "operator": "eq", "value": "11-50"}]' }),
    combinator: folkAi.combinatorProp(),
    ...folkAi.paginationProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const groupId = folkFields.idList({ value: folkFields.textValue({ value: p.groupId }), label: 'Group ID', prefix: 'grp_', max: 1 });
    const query = folkAi.filterQuery({
      filters: [
        { field: 'name', operator: 'like', value: folkFields.textValue({ value: p.name }) },
        { field: 'emails', operator: 'like', value: folkFields.textValue({ value: p.email }) },
        { field: 'urls', operator: 'like', value: folkFields.textValue({ value: p.url }) },
        { field: 'industry', operator: 'like', value: folkFields.textValue({ value: p.industry }) },
        { field: 'groups', operator: 'in', subKey: 'id', value: groupId?.[0] },
        { field: 'createdAt', operator: 'gt', value: folkFields.dateValue({ value: p.createdAfter, label: 'Created After' }) },
        { field: 'createdAt', operator: 'lt', value: folkFields.dateValue({ value: p.createdBefore, label: 'Created Before' }) },
        ...folkAi.extraFilters({ value: p.extraFilters }),
      ],
      combinator: p.combinator,
    });
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: '/v1/companies',
      query,
      ...folkAi.paging({ propsValue: p }),
    });
    return folkAi.pageResult({ page });
  },
});

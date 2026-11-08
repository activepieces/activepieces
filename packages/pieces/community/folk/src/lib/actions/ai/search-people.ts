import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkOutputSchemas } from '../../output-schemas';

export const searchPeople = createAction({
  auth: folkAuth,
  name: 'search_people',
  displayName: 'Search People',
  description: 'Find people in Folk by name, email, phone, job title, company, group or creation date.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: folkOutputSchemas.people,
  aiMetadata: {
    description:
      'Searches Folk people and returns one page (up to 100) with hasMore and nextCursor; pass nextCursor back as Cursor to read further pages. Text filters are contains-matches. Company ID and Group ID match people linked to that company or in that group. Extra Filters accept any Folk filter, e.g. a group custom field: {"field": "customFieldValues.grp_....Status", "operator": "in", "value": "Lead"}. With no filters it lists everyone. count is the number of items on this page, not a total. Read-only.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name Contains', description: 'Text the full name contains.', required: false }),
    email: Property.ShortText({ displayName: 'Email Contains', description: 'Text an email contains, e.g. "@acme.com".', required: false }),
    phone: Property.ShortText({ displayName: 'Phone Contains', description: 'Text a phone number contains.', required: false }),
    jobTitle: Property.ShortText({ displayName: 'Job Title Contains', description: 'Text the job title contains.', required: false }),
    companyId: Property.ShortText({ displayName: 'Company ID', description: 'Only people linked to this company (com_...).', required: false }),
    groupId: Property.ShortText({ displayName: 'Group ID', description: 'Only people in this group (grp_...).', required: false }),
    createdAfter: Property.ShortText({ displayName: 'Created After', description: 'YYYY-MM-DD; people created after this day.', required: false }),
    createdBefore: Property.ShortText({ displayName: 'Created Before', description: 'YYYY-MM-DD; people created before this day.', required: false }),
    extraFilters: folkAi.extraFiltersProp({ example: '[{"field": "customFieldValues.grp_123.Status", "operator": "in", "value": "Lead"}]' }),
    combinator: folkAi.combinatorProp(),
    ...folkAi.paginationProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const companyId = folkFields.idList({ value: folkFields.textValue({ value: p.companyId }), label: 'Company ID', prefix: 'com_', max: 1 });
    const groupId = folkFields.idList({ value: folkFields.textValue({ value: p.groupId }), label: 'Group ID', prefix: 'grp_', max: 1 });
    const query = folkAi.filterQuery({
      filters: [
        { field: 'fullName', operator: 'like', value: folkFields.textValue({ value: p.name }) },
        { field: 'emails', operator: 'like', value: folkFields.textValue({ value: p.email }) },
        { field: 'phones', operator: 'like', value: folkFields.textValue({ value: p.phone }) },
        { field: 'jobTitle', operator: 'like', value: folkFields.textValue({ value: p.jobTitle }) },
        { field: 'companies', operator: 'in', subKey: 'id', value: companyId?.[0] },
        { field: 'groups', operator: 'in', subKey: 'id', value: groupId?.[0] },
        { field: 'createdAt', operator: 'gt', value: folkFields.dateValue({ value: p.createdAfter, label: 'Created After' }) },
        { field: 'createdAt', operator: 'lt', value: folkFields.dateValue({ value: p.createdBefore, label: 'Created Before' }) },
        ...folkAi.extraFilters({ value: p.extraFilters }),
      ],
      combinator: p.combinator,
    });
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: '/v1/people',
      query,
      ...folkAi.paging({ propsValue: p }),
    });
    return folkAi.pageResult({ page });
  },
});

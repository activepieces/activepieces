import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const listGroupCustomFields = createAction({
  auth: folkAuth,
  name: 'list_group_custom_fields',
  displayName: 'List Group Custom Fields',
  description: 'List the custom fields of a Folk group for people, companies or objects.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: folkOutputSchemas.customFields,
  aiMetadata: {
    description:
      'Lists a Folk group\'s custom fields (name, type, select options) for people, companies or an object type such as "Deals". Use the names and option labels to fill Custom Field Values or custom field filters. Paged with hasMore and nextCursor. Read-only.',
    idempotent: true,
  },
  props: {
    groupId: folkAi.idProp({ displayName: 'Group ID', description: 'ID of the group (grp_...). Get it from List Groups.' }),
    entityType: Property.ShortText({
      displayName: 'Record Type',
      description: 'person, company, or an object type name such as Deals.',
      required: true,
    }),
    ...folkAi.paginationProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const group = folkClient.idSegment({ value: p.groupId, label: 'Group ID' });
    const entityType = folkClient.nameSegment({ value: p.entityType, label: 'Record Type' });
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: `/v1/groups/${group}/custom-fields/${entityType}`,
      ...folkAi.paging({ propsValue: p }),
    });
    return folkAi.pageResult({ page });
  },
});

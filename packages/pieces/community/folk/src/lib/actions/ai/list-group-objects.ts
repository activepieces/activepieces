import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkObjectFields } from '../../common/object-fields';
import { folkOutputSchemas } from '../../output-schemas';

export const listGroupObjects = createAction({
  auth: folkAuth,
  name: 'list_group_objects',
  displayName: 'List Group Objects (Deals)',
  description: 'List objects, such as deals, in a Folk group.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: folkOutputSchemas.objects,
  aiMetadata: {
    description:
      'Lists objects of one type (for example Deals) in a Folk group, one page at a time with hasMore and nextCursor. Optional Name Contains and Extra Filters, e.g. {"field": "customFieldValues.Status", "operator": "in", "value": "Qualified"}. Read-only.',
    idempotent: true,
  },
  props: {
    ...folkObjectFields.objectProps(),
    name: Property.ShortText({ displayName: 'Name Contains', description: 'Text the object name contains.', required: false }),
    extraFilters: folkAi.extraFiltersProp({ example: '[{"field": "customFieldValues.Status", "operator": "in", "value": "Qualified"}]' }),
    combinator: folkAi.combinatorProp(),
    ...folkAi.paginationProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const query = folkAi.filterQuery({
      filters: [
        { field: 'name', operator: 'like', value: folkFields.textValue({ value: p.name }) },
        ...folkAi.extraFilters({ value: p.extraFilters }),
      ],
      combinator: p.combinator,
    });
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: folkObjectFields.objectPath({ groupId: p.groupId, objectType: p.objectType }),
      query,
      ...folkAi.paging({ propsValue: p }),
    });
    return folkAi.pageResult({ page });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../common/auth';
import { equalsFilter, klaviyoApi } from '../../common/client';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const listListsAi = createAction({
  auth: klaviyoAuth,
  name: 'list_lists_ai',
  classification: 'SEARCH',
  displayName: 'List Lists',
  description: 'List Klaviyo lists, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Klaviyo lists (up to 10 per page) with their IDs, optionally only those with a given whole name (letter case ignored). Use to discover list IDs; pass next_cursor back as cursor for more. For member counts use Get List. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiListPage,
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Whole list name to match; letter case is ignored.', required: false }),
    page_size: klaviyoInputs.pageSizeProp({ max: 10, defaultValue: 10 }),
    cursor: klaviyoInputs.cursorProp(),
  },
  async run({ auth, propsValue }) {
    const name = klaviyoInputs.optionalText(propsValue.name);
    const page = await klaviyoApi.listPage({
      auth,
      path: '/lists',
      query: {
        filter: name === undefined ? undefined : equalsFilter({ field: 'name', value: name }),
        'page[size]': klaviyoInputs.pageSize({ value: propsValue.page_size, max: 10, defaultValue: 10 }),
      },
      cursor: klaviyoInputs.optionalText(propsValue.cursor),
    });
    return klaviyoInputs.pageOutput({ page, map: klaviyoInputs.flatGroup });
  },
});

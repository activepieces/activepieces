import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

const SORTS = ['name', 'date', 'size'];
const DIRECTIONS = ['ASC', 'DESC'];

export const listTrashedItemsAction = createAction({
  auth: boxAuth,
  name: 'box_list_trashed_items',
  displayName: 'List Trashed Items',
  description: 'Lists the files, folders and web links in the Box trash.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the items in the user\'s trash with their IDs and types, for Restore File, Restore Folder or the Delete Permanently actions. Page with Offset (at most 10000); total_count can exceed what is returned.',
    idempotent: true,
  },
  props: {
    limit: boxAiProps.limit({ required: false }),
    offset: boxAiProps.offset({ required: false }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Sort by "name", "date" or "size". Folders always come first.',
      required: false,
      options: { options: SORTS.map((value) => ({ label: value, value })) },
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: '"ASC" or "DESC".',
      required: false,
      options: { options: DIRECTIONS.map((value) => ({ label: value, value })) },
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.sort !== undefined && !SORTS.includes(propsValue.sort)) {
      throw new Error(`Sort must be one of: ${SORTS.join(', ')}.`);
    }
    if (propsValue.direction !== undefined && !DIRECTIONS.includes(propsValue.direction)) {
      throw new Error(`Direction must be one of: ${DIRECTIONS.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/folders/trash/items',
      query: {
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
        sort: propsValue.sort,
        direction: propsValue.direction,
        fields: propsValue.fields,
      },
    });
  },
});

import { attioAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { attioApiService } from '../common/request';

export const findListEntry = createAction({
  auth: attioAuth,
  name: 'findListEntry',
  displayName: 'Find List Entry',
  description: 'Locate list entry in attio',
  props: {
    listName: Property.ShortText({
      displayName: 'List Name',
      description: 'The Name of the list to query entries for',
      required: true,
    }),
    filter: Property.Object({
      displayName: 'Filter',
      description:
        'Filter criteria to apply. For example: {"name": "John Doe"}',
      required: false,
    }),
    sorts: Property.Array({
      displayName: 'Sort',
      description: 'Sort order for results',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Maximum number of entries to return (default: 100, max: 500)',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of entries to skip',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { listName, filter, sorts, limit, offset } = context.propsValue;

    const list = await attioApiService.getListByListName(context.auth, listName);

    return await attioApiService.findEntry({
      auth: context.auth,
      list: list.id.list_id,
      payload: {
        filter,
        sorts,
        limit,
        offset,
      },
    });
  },
});

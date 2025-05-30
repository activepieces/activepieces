import { createAction, Property } from '@activepieces/pieces-framework';
import { attioApiService } from '../common/request';
import { attioAuth } from '../../';

export const updateEntry = createAction({
  auth: attioAuth,
  name: 'updateEntry',
  displayName: 'Update Entry',
  description: 'Updates an entry in attio',
  props: {
    listName: Property.ShortText({
      displayName: 'List Name',
      description:
        'The Name of the list that the list entry belongs to.',
      required: true,
    }),
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The UUID of the list entry to update.',
      required: true,
    }),
    entryValues: Property.Object({
      displayName: 'Entry Values',
      description:
        'An object with attribute API slugs or IDs as keys and their values. For multiselect attributes, values will be appended to existing ones.',
      required: true,
    }),
  },
  async run(context) {
    const { listName, entryId, entryValues } = context.propsValue;

    const list = await attioApiService.getListByListName(
      context.auth,
      listName
    );

    return await attioApiService.updateEntry({
      auth: context.auth,
      entryId,
      list: list.id.list_id,
      payload: {
        entry_values: entryValues,
      },
    });
  },
});

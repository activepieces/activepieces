import { attioAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { attioApiService } from '../common/request';

export const createEntry = createAction({
  auth: attioAuth,
  name: 'createEntry',
  displayName: 'Create Entry',
  description: 'Creates a new entry in attio',
  props: {
    listName: Property.ShortText({
      displayName: 'List Name',
      description:
        'The Name of the list that the created list entry should belong to.',
      required: true,
    }),
    parentRecordId: Property.ShortText({
      displayName: 'Parent Record ID',
      description: 'A UUID identifying the record you want to add to the list.',
      required: true,
    }),
    parentObject: Property.ShortText({
      displayName: 'Parent Object',
      description:
        'A UUID or slug identifying the object that the added parent record belongs to (e.g., people).',
      required: true,
    }),
    entryValues: Property.Object({
      displayName: 'Entry Values',
      description:
        'An object with attribute API slugs or IDs as keys and their values. For multi-select attributes, use arrays of values.',
      required: true,
    }),
  },
  async run(context) {
    const { listName, parentRecordId, parentObject, entryValues } =
      context.propsValue;

    const list = await attioApiService.getListByListName(
      context.auth,
      listName
    );

    return await attioApiService.createEntry({
      auth: context.auth,
      list: list.id.list_id,
      payload: {
        parent_record_id: parentRecordId,
        parent_object: parentObject,
        entry_values: entryValues,
      },
    });
  },
});

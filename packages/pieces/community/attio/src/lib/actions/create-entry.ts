import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../..';

export const createEntry = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  auth: attioAuth,
  name: 'createEntry',
  displayName: 'Create Entry',
  description: 'Add a record to a list as a new list entry.',
  props: {
    list: Property.ShortText({
      displayName: 'List',
      description: 'The UUID or slug identifying the list that the created list entry should belong to.',
      required: true,
    }),
    parentRecordId: Property.ShortText({
      displayName: 'Parent Record ID',
      description: 'A UUID identifying the record you want to add to the list.',
      required: true,
    }),
    parentObject: Property.ShortText({
      displayName: 'Parent Object',
      description: 'A UUID or slug identifying the object that the added parent record belongs to (e.g., people).',
      required: true,
    }),
    entryValues: Property.Object({
      displayName: 'Entry Values',
      description: 'An object with attribute API slugs or IDs as keys and their values. For multi-select attributes, use arrays of values.',
      required: true,
    }),
  },
  async run(context) {
    const { list, parentRecordId, parentObject, entryValues } = context.propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.attio.com/v2/lists/${list}/entries`,
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        data: {
          parent_record_id: parentRecordId,
          parent_object: parentObject,
          entry_values: entryValues,
        },
      },
    });

    return response.body;
  },
});

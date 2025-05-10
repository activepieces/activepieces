import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../..';

export const updateEntry = createAction({
  auth: attioAuth,
  name: 'updateEntry',
  displayName: 'Update Entry',
  description: 'Update a list entry in Attio. For multiselect attributes, values will be appended to existing ones.',
  props: {
    list: Property.ShortText({
      displayName: 'List',
      description: 'The UUID or slug of the list the entry belongs to.',
      required: true,
    }),
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The UUID of the list entry to update.',
      required: true,
    }),
    entryValues: Property.Object({
      displayName: 'Entry Values',
      description: 'An object with attribute API slugs or IDs as keys and their values. For multiselect attributes, values will be appended to existing ones.',
      required: true,
    }),
  },
  async run(context) {
    const { list, entryId, entryValues } = context.propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://api.attio.com/v2/lists/${list}/entries/${entryId}`,
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        data: {
          entry_values: entryValues,
        },
      },
    });

    return response.body;
  },
});

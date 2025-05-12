import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const updateEntryAction = createAction({
  name: 'update_entry',
  displayName: 'Update List Entry',
  description: 'Update an entry in a list in Attio',
  auth: attioAuth,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list containing the entry',
      required: true,
    }),
    entry_id: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The ID of the entry to update',
      required: true,
    }),
    attributes: Property.Object({
      displayName: 'Entry Attributes',
      description: 'The attributes to update (e.g., status, custom fields)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { list_id, entry_id, attributes } = propsValue;

    // Format the request payload according to Attio API requirements
    const payload = {
      data: {
        entry_values: attributes
      }
    };

    const response = await makeRequest(
      auth,
      HttpMethod.PUT, // Change to PUT as shown in the API documentation
      `/lists/${list_id}/entries/${entry_id}`,
      payload
    );

    return response;
  },
});

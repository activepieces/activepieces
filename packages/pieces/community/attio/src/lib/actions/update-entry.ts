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
      description: 'The attributes to update. Use key:value format',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { list_id, entry_id, attributes } = propsValue;

    const response = await makeRequest(
      auth,
      HttpMethod.PATCH,
      `/lists/${list_id}/entries/${entry_id}`,
      {
        attributes: attributes
      }
    );

    return response;
  },
});

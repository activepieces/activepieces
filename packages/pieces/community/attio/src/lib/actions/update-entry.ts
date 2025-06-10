import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const updateEntryAction = createAction({
  name: 'update_entry',
  displayName: 'Update List Entry',
  description: 'Update the attributes of an existing entry in a list in Attio',
  auth: attioAuth,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The unique identifier of the list containing the entry',
      required: true,
    }),
    entry_id: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The unique identifier of the entry to update',
      required: true,
    }),
    attributes: Property.Object({
      displayName: 'Updated Attributes',
      description: 'The entry attributes to update (e.g., status, priority, custom fields). Only provide the fields you want to change.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const { list_id, entry_id, attributes } = propsValue;

      if (!list_id) {
        throw new Error('List ID is required');
      }

      if (!entry_id) {
        throw new Error('Entry ID is required');
      }

      if (!attributes || typeof attributes !== 'object') {
        throw new Error('Attributes must be a valid object');
      }

      const payload = {
        data: {
          entry_values: attributes
        }
      };

      const response = await makeRequest(
        auth,
        HttpMethod.PATCH,
        `/lists/${list_id}/entries/${entry_id}`,
        payload
      );

      if (!response?.data) {
        throw new Error('Invalid response from Attio API');
      }

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update list entry: ${errorMessage}`);
    }
  },
});

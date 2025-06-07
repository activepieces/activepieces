import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const createEntryAction = createAction({
  name: 'create_entry',
  displayName: 'Create List Entry',
  description: 'Add a record to a list in Attio',
  auth: attioAuth,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The unique identifier of the list to add the entry to',
      required: true,
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The unique identifier of the record to add to the list',
      required: true,
    }),
    parent_object: Property.Dropdown({
      displayName: 'Parent Object Type',
      description: 'The type of object the record belongs to (e.g., people, companies, deals)',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/objects'
          );

          if (!response?.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response format from objects endpoint');
          }

          return {
            options: response.data.map((object: any) => {
              return {
                label: object.plural_noun || object?.singular_noun,
                value: object.api_slug,
              };
            }),
          };
        } catch (error) {
          console.error('Error fetching object types:', error);
          return {
            disabled: true,
            placeholder: 'Error fetching object types. Please check your API key.',
            options: [],
          };
        }
      },
    }),
    attributes: Property.Object({
      displayName: 'Entry Attributes',
      description: 'Additional attributes for the list entry (e.g., status, priority, custom fields). Leave empty if no additional attributes are needed.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const { list_id, record_id, parent_object, attributes } = propsValue;

      if (!list_id) {
        throw new Error('List ID is required');
      }

      if (!record_id) {
        throw new Error('Record ID is required');
      }

      if (!parent_object) {
        throw new Error('Parent object type is required');
      }

      const payload = {
        data: {
          parent_record_id: record_id,
          parent_object: parent_object,
          entry_values: attributes || {}
        }
      };

      const response = await makeRequest(
        auth,
        HttpMethod.POST,
        `/lists/${list_id}/entries`,
        payload
      );

      if (!response?.data) {
        throw new Error('Invalid response from Attio API');
      }

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create list entry: ${errorMessage}`);
    }
  },
});

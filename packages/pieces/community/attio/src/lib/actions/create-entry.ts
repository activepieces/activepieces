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
      description: 'The ID of the list to add the entry to',
      required: true,
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to add to the list',
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

          return {
            options: response.data.map((object: any) => {
              return {
                label: object.plural_noun,
                value: object.api_slug,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error fetching object types',
            options: [],
          };
        }
      },
    }),
    attributes: Property.Object({
      displayName: 'Entry Attributes',
      description: 'The attributes of the entry (e.g., status, custom fields)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { list_id, record_id, parent_object, attributes } = propsValue;

    // Format the request payload according to Attio API requirements
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

    return response;
  },
});

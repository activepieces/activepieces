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
    attributes: Property.Object({
      displayName: 'Entry Attributes',
      description: 'The attributes of the entry. Use key:value format',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { list_id, record_id, attributes } = propsValue;

    const payload = {
      record_id: record_id,
      attributes: attributes || {}
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

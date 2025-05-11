import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const findListEntryAction = createAction({
  name: 'find_list_entry',
  displayName: 'Find List Entry',
  description: 'Find entries in a list in Attio based on criteria',
  auth: attioAuth,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to search in',
      required: true,
    }),
    query_params: Property.Object({
      displayName: 'Search Criteria',
      description: 'Key-value pairs to search for (e.g., {"status": "active"})',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { list_id, query_params } = propsValue;

    // Convert query params to URL parameters
    let queryString = '';
    if (query_params) {
      queryString = Object.entries(query_params)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');
    }

    const url = `/lists/${list_id}/entries${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      url,
      undefined
    );

    return response;
  },
});

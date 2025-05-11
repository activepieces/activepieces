import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const findRecordAction = createAction({
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Find a record in Attio by unique attributes',
  auth: attioAuth,
  props: {
    object_type: Property.ShortText({
      displayName: 'Object Type',
      description: 'The type of record to find (e.g., person, company, deal)',
      required: true,
    }),
    query_params: Property.Object({
      displayName: 'Search Criteria',
      description: 'Key-value pairs to search for (e.g., {"email": "example@test.com"})',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { object_type, query_params } = propsValue;

    // Convert query params to URL parameters
    const queryString = Object.entries(query_params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/objects/${object_type}/records?${queryString}`,
      undefined
    );

    return response;
  },
});

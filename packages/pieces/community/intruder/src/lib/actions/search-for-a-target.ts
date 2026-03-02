import { createAction, Property } from '@activepieces/pieces-framework';
import { intruderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchForATarget = createAction({
  auth: intruderAuth,
  name: 'searchForATarget',
  displayName: 'Search For a Target',
  description: 'Search for targets by address',
  props: {
    address: Property.ShortText({
      displayName: 'Target Address',
      description:
        'The address or domain to search for (e.g., example.com, 192.168.1.1)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/targets/?address=${encodeURIComponent(propsValue.address)}`
    );

    return response;
  },
});

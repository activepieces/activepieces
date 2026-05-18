import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { callIdDropdown } from '../common/props';

export const getCall = createAction({
  auth: aircallAuth,
  name: 'getCall',
  displayName: 'Get Call',
  description: 'Retrieves details about a specific call.',
  props: {
    callId: callIdDropdown,
  },
  async run(context) {
    const { callId } = context.propsValue;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('fetch_contact', 'true');
    queryParams.set('fetch_short_urls', 'true');
    queryParams.set('fetch_call_timeline', 'true');

    const queryString = queryParams.toString();
    const path = `/calls/${callId}${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest(context.auth, HttpMethod.GET, path);

    return response;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { callIdDropdown } from '../common/props';

export const getCall = createAction({
  auth: aircallAuth,
  name: 'getCall',
  displayName: 'Get Call',
  description:
    'Retrieve details about a specific call including duration, direction, status, timestamps, comments and tags',
  props: {
    callId: callIdDropdown,
    fetch_contact: Property.Checkbox({
      displayName: 'Fetch Contact Details',
      description: 'When enabled, includes contact details in the response',
      required: false,
      defaultValue: false,
    }),
    fetch_short_urls: Property.Checkbox({
      displayName: 'Fetch Short URLs',
      description: 'When enabled, includes short URLs in the response',
      required: false,
      defaultValue: false,
    }),
    fetch_call_timeline: Property.Checkbox({
      displayName: 'Fetch Call Timeline',
      description:
        'When enabled, includes IVR options selected in the response',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { callId, fetch_contact, fetch_short_urls, fetch_call_timeline } =
      context.propsValue;
    const accessToken = context.auth.access_token;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (fetch_contact) queryParams.set('fetch_contact', 'true');
    if (fetch_short_urls) queryParams.set('fetch_short_urls', 'true');
    if (fetch_call_timeline) queryParams.set('fetch_call_timeline', 'true');

    const queryString = queryParams.toString();
    const path = `/calls/${callId}${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest(accessToken, HttpMethod.GET, path);

    return response;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MagicalapiAuth } from '../common/auth';

export const getProfileData = createAction({
  name: 'getProfileData',
  displayName: 'Get Profile Data',
  description: 'Extract comprehensive professional information from LinkedIn profiles',
  auth: MagicalapiAuth,
  props: {
    profile_name: Property.ShortText({
      displayName: 'LinkedIn Profile Username',
      description: 'The LinkedIn profile username (found in profile URL after /in/). Example: For "https://www.linkedin.com/in/williamhgates/", enter "williamhgates"',
      required: true,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: 'Use an existing request ID to fetch results of a previous request',
      required: false,
    }),
  },
  async run(context) {
    const { profile_name, request_id } = context.propsValue;
    const auth = context.auth;

    const payload: Record<string, string> = {};
    if (request_id) {
      payload['request_id'] = request_id;
    } else if (profile_name) {
      payload['profile_name'] = profile_name;
    } else {
      throw new Error('Either LinkedIn Profile Username or Request ID is required');
    }

    let response = await makeRequest(
      auth,
      HttpMethod.POST,
      '/profile-data',
      payload
    );

    
    if (response.request_id && !response.profile) {
      let attempts = 0;
      const maxAttempts = 5;
      const pollingInterval = 1000;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));

        response = await makeRequest(
          auth,
          HttpMethod.POST,
          '/profile-data',
          { request_id: response.request_id }
        );

        if (response.profile) {
          break;
        }

        attempts++;
      }

      if (!response.profile) {
        throw new Error(
          'Profile data retrieval is taking longer than expected. Please try again with the request_id: ' +
            response.request_id
        );
      }
    }

    return response;
  },
});

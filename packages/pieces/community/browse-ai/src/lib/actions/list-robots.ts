import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browseAiApiCall } from '../common/client';
import { browseAiAuth } from '../common/auth';

export const listRobotsAction = createAction({
  name: 'list-robots',
  auth: browseAiAuth,
  displayName: 'List Robots',
  description: 'Retrieves all robots available in your account.',
  props: {},
  async run(context) {
    try {
      const response = await browseAiApiCall({
        auth: { apiKey: context.auth as string },
        method: HttpMethod.GET,
        resourceUri: '/robots',
      });

      return response;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      }

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before retrying.');
      }

      throw new Error(
        `Failed to fetch robots: ${error.message || 'Unknown error occurred'}`
      );
    }
  },
});

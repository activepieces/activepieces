import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dittofeedAuth } from '../..';

export const identifyAction = createAction({
  name: 'identify',
  auth: dittofeedAuth,
  displayName: 'Identify User',
  description: 'Identify a user in Dittofeed.',
  audience: 'both',
  aiMetadata: { description: 'Sends an identify event to Dittofeed that links a userId to a set of traits (e.g. email, name, attributes), creating or updating that user profile in the customer data platform. Use to register a new user or attach/refresh trait data before tracking activity. Requires a userId; each call posts a new event with a unique messageId, so it is not idempotent.', idempotent: false },
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      required: true,
    }),
    traits: Property.Object({
      displayName: 'User Traits',
      required: false,
    }),
  },
  async run(context) {
    const { userId, traits } = context.propsValue;
    const { apiKey, baseUrl } = context.auth.props;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/api/public/apps/identify`,
        headers: {
          Authorization: apiKey,
        },
        body: {
          type: 'identify',
          messageId: `identify-${userId}-${Date.now()}`,
          userId,
          traits,
        },
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      } else if (error.response?.status === 404) {
        throw new Error(`Dittofeed API endpoint not found. Please check your base URL: ${baseUrl}`);
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status >= 500) {
        throw new Error(`Dittofeed server error: ${error.response?.body?.message || error.message}`);
      }
      throw new Error(`Failed to identify user in Dittofeed: ${error.message || 'Unknown error'}`);
    }
  },
});

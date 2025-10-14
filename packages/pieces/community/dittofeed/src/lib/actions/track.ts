import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dittofeedAuth } from '../..';

export const trackAction = createAction({
  name: 'track',
  auth: dittofeedAuth,
  displayName: 'Track Event',
  description: 'Track an event for a user.',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      required: true,
    }),
    event: Property.ShortText({
      displayName: 'Event Name',
      required: true,
    }),
    properties: Property.Object({
      displayName: 'Event Properties',
      required: false,
    }),
  },
  async run(context) {
    const { userId, event, properties } = context.propsValue;
    const { apiKey, baseUrl } = context.auth;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/api/public/apps/track`,
        headers: {
          Authorization: apiKey,
        },
        body: {
          type: 'track',
          messageId: `track-${userId}-${event}-${Date.now()}`,
          userId,
          event,
          properties,
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
      throw new Error(`Failed to track event in Dittofeed: ${error.message || 'Unknown error'}`);
    }
  },
});

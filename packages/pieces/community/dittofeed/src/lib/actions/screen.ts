import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dittofeedAuth } from '../..';

export const screenAction = createAction({
  name: 'screen',
  auth: dittofeedAuth,
  displayName: 'Screen Event',
  description: 'Track a screen view event.',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Screen Name',
      required: true,
    }),
    properties: Property.Object({
      displayName: 'Screen Properties',
      required: false,
    }),
  },
  async run(context) {
    const { userId, name, properties } = context.propsValue;
    const { apiKey, baseUrl } = context.auth;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/api/public/apps/screen`,
        headers: {
          Authorization: apiKey,
        },
        body: {
          type: 'screen',
          messageId: `screen-${userId}-${name}-${Date.now()}`,
          userId,
          name,
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
      throw new Error(`Failed to track screen view in Dittofeed: ${error.message || 'Unknown error'}`);
    }
  },
});

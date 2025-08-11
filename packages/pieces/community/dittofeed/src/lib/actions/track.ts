import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dittofeedAuth } from '../..';

export const trackAction = createAction({
  name: 'track',
  auth: dittofeedAuth,
  displayName: 'Track Event',
  description: 'Track an event for a user',
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

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `http://localhost:3200/api/public/apps/track`,
      headers: {
        Authorization: context.auth,
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
  },
});

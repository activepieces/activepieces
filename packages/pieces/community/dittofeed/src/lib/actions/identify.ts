import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dittofeedAuth } from '../..';

export const identifyAction = createAction({
  name: 'identify',
  auth: dittofeedAuth,
  displayName: 'Identify User',
  description: 'Identify a user in Dittofeed',
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

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `http://localhost:3200/api/public/apps/identify`,
      headers: {
        Authorization: context.auth,
      },
      body: {
        type: 'identify',
        messageId: `identify-${userId}-${Date.now()}`,
        userId,
        traits,
      },
    });

    return response.body;
  },
});

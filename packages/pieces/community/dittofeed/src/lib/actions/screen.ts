import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dittofeedAuth } from '../..';

export const screenAction = createAction({
  name: 'screen',
  auth: dittofeedAuth,
  displayName: 'Screen Event',
  description: 'Track a screen view event',
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

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `http://localhost:3200/api/public/apps/screen`,
      headers: {
        Authorization: context.auth,
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
  },
});

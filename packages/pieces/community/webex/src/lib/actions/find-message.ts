import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { webexAuth } from '../common/auth';

export const findMessage = createAction({
  auth: webexAuth,
  name: 'findMessage',
  displayName: 'Find Message',
  description: 'Retrieve details for a specific message by message ID',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The unique identifier for the message',
      required: true,
    }),
  },
  async run(context) {
    const messageId = context.propsValue.messageId as string;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/messages/${encodeURIComponent(messageId)}`,
      undefined
    );

    return response;
  },
});

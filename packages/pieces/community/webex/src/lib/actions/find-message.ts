import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const findMessage = createAction({
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

    // Validate required fields
    if (!messageId || messageId.trim() === '') {
      throw new Error('Message ID is required');
    }

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/messages/${encodeURIComponent(messageId)}`,
      undefined
    );

    return response;
  },
});

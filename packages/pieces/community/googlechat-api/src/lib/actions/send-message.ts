import { googleChatApiAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const sendMessage = createAction({
  auth: googleChatApiAuth,
  name: 'send-message',
  displayName: 'Send a Message',
  description: 'Send a message to a space or direct conversation',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space to send the message to',
      required: true,
    }),
    messageText: Property.LongText({
      displayName: 'Message Text',
      description: 'The text content of the message',
      required: true,
    }),
    threadKey: Property.ShortText({
      displayName: 'Thread Key (Optional)',
      description: 'The thread key if sending to a specific thread',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const { spaceId, messageText, threadKey } = propsValue;

    const baseUrl = 'https://chat.googleapis.com/v1';
    const endpoint = `${baseUrl}/spaces/${spaceId}/messages`;

    const messageData: any = {
      text: messageText,
    };

    if (threadKey) {
      messageData.thread = {
        name: `spaces/${spaceId}/threads/${threadKey}`,
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send message: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 
import { googleChatApiAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const getDirectMessageDetails = createAction({
  auth: googleChatApiAuth,
  name: 'get-direct-message-details',
  displayName: 'Get Direct Message Details',
  description: 'Retrieve details of a specific direct message by ID',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to retrieve',
      required: true,
    }),
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space containing the message',
      required: true,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const { messageId, spaceId } = propsValue;

    const baseUrl = 'https://chat.googleapis.com/v1';
    const endpoint = `${baseUrl}/spaces/${spaceId}/messages/${messageId}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get message details: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 
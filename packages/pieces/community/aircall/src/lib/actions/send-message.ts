import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { numberIdDropdown } from '../common/props';

export const sendMessage = createAction({
  auth: aircallAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description:
    'Send a text message or multimedia message from a configured Aircall number',
  props: {
    numberId: numberIdDropdown,
    to: Property.ShortText({
      displayName: 'To',
      description:
        'Phone number you want to send the message to (e.g., +1234567890)',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Message Body',
      description: 'The text content of the message',
      required: true,
    }),
    mediaUrl: Property.Array({
      displayName: 'Media URLs',
      description: 'Optional array of media URLs to send with the message',
      required: false,
      properties: {
        url: Property.ShortText({
          displayName: 'Media URL',
          description: 'URL of the media file to attach',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { numberId, to, body, mediaUrl } = context.propsValue;
    const accessToken = context.auth.access_token;

    // Prepare request body
    const requestBody: any = {
      to,
      body,
    };

    // Add media URLs if provided
    if (mediaUrl && mediaUrl.length > 0) {
      requestBody.mediaUrl = mediaUrl;
    }

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      `/numbers/${numberId}/messages/send`,
      requestBody
    );

    return response;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { orimonAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendMessage = createAction({
  auth: orimonAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description: 'Send a message to an Orimon chatbot and get a response',
  props: {
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      description:
        'To get it: Login to your dashboard and click on the bot configuration page. At the top in the URL bar, copy the value starting after "tenant/" to the end.',
      required: true,
    }),
    messageText: Property.LongText({
      displayName: 'Message',
      description: 'The message to send to the chatbot',
      required: true,
    }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'Unique identifier for this message',
      required: false,
    }),
  },
  async run(context) {
    const { tenantId, messageText, messageId } = context.propsValue;
    const apiKey = context.auth;

    const randomValue = Math.random().toString(36).substring(2, 15);
    const psid = `${randomValue}_${tenantId}`;

    const payload = {
      type: 'message',
      info: {
        psid: psid,
        sender: 'user',
        tenantId: tenantId,
        platformName: 'web',
      },
      message: {
        id: messageId || `msg_${Date.now()}`,
        type: 'text',
        payload: {
          text: messageText,
        },
      },
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://channel-connector.orimon.ai/orimon/v1/conversation/api/message',
        headers: {
          authorization: `apiKey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      return response.body;
    } catch (error) {
      throw new Error(
        `Failed to send message to Orimon: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },
});

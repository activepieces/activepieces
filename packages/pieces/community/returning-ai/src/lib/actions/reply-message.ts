import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getApiEndpoint } from '../common';
import { returningAiAuth } from '../../index';

/**
 * This action allows you to reply to a specific message as a chosen user in a channel.
 * The reply will appear as if the selected user posted it directly in response to the original message.
 * 
 * When using this action, you need to provide:
 * 1. The username or email of the sender (who will appear to have sent the reply)
 * 2. The ID of the message being replied to
 * 3. The content of the reply message
 * 
 * The API will handle threading the reply appropriately in the channel's conversation.
 * 
 * @example
 * ```
 * // Example response
 * {
 *   "status": "success",
 *   "message": "Message reply successfully"
 * }
 * ```
 * 
 * @link https://dev.returning.ai/api-16179164
 */
export const replyMessage = createAction({
  auth:returningAiAuth,
  name: 'replyMessage',
  displayName: 'Reply Message',
  description: 'Reply to a specific message as a chosen user in a channel.',
  props: {
    description: Property.MarkDown({
      value:
        'This action allows you to reply to a message in any accessible channel on behalf of a specific user. The reply will appear as if the selected user posted it directly in response to the original message.',
    }),
    user: Property.ShortText({
      displayName: 'Sender (Username or email)',
      description: 'The user account that will send the message',
      required: true,
    }),
    messageId: Property.ShortText({
      displayName: 'Reply to (Message ID)',
      description: 'The ID of the message to reply to. ',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The content of the reply to be posted.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authToken = auth as string;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${getApiEndpoint(authToken)}/apis/v1/messages/reply`,
      headers: {
        Authorization: `Bearer ${authToken.includes(':') ? authToken.split(':')[1] : authToken}`,
      },
      body: {
        messageId: propsValue.messageId,
        message: propsValue.message,
        sender: propsValue.user,
      },
    });
    return response.body;
  },
});

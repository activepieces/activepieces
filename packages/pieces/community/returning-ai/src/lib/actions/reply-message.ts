import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getApiEndpoint } from '../common';
import { returningAiAuth } from '../auth';

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
  classification: 'WRITE',
  displayName: 'Reply to Message',
  description: 'Replies to a message as a chosen user.',
  audience: 'both',
  aiMetadata: { description: 'Posts a threaded reply to an existing Returning.ai message on behalf of a given user (identified by username or email), so the reply appears as if that user sent it. Use to respond in-thread to a known message; requires the target message ID and the reply text. Not idempotent: each call adds a new reply.', idempotent: false },
  props: {
    description: Property.MarkDown({
      value: 'The reply is posted as the sender, as if they wrote it.',
    }),
    user: Property.ShortText({
      displayName: 'Sender',
      description: 'Username or email of a community member.',
      placeholder: 'jane or jane@example.com',
      required: true,
    }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: "ID of the message, from Returning AI's Get Messages API.",
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Text of the reply.',
      required: true,
    }),
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Reply As',
      icon: 'user',
      props: ['description', 'user'],
    },
    {
      key: 'reply',
      display: 'section',
      label: 'Reply',
      icon: 'reply',
      props: ['messageId', 'message'],
    },
  ],
  async run({ propsValue, auth }) {
    const authToken = auth.secret_text;
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

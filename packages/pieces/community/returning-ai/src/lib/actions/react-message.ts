import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getApiEndpoint } from '../common';
import { returningAiAuth } from '../auth';

/**
 * This action allows you to react to a specific message as a chosen user in a channel.
 * The reaction will appear as if the selected user added it directly to the message.
 * 
 * When using this action, you need to provide:
 * 1. The username or email of the sender (who will appear to have reacted)
 * 2. The ID of the message being reacted to
 * 3. The emoji reaction to add (e.g. :sparkling_heart:)
 * 
 * The API will handle adding the reaction appropriately to the message.
 * 
 * @example
 * ```
 * // Example response
 * {
 *   "status": "success",
 *   "message": "Reaction added successfully"
 * }
 * ```
 * 
 * @link https://dev.returning.ai/api-16179164
 */
export const reactMessage = createAction({
  auth: returningAiAuth,
  name: 'reactMessage', 
  classification: 'WRITE',
  displayName: 'React to Message',
  description: 'Adds an emoji reaction to a message as a chosen user.',
  audience: 'both',
  aiMetadata: { description: 'Adds an emoji reaction to an existing Returning.ai message on behalf of a given user (identified by username or email), so the reaction appears as if that user added it. Use to acknowledge or react to a known message; requires the target message ID and an emoji shortcode (e.g. :sparkling_heart:). Not idempotent: the API is called on each invocation.', idempotent: false },
  props: {
    description: Property.MarkDown({
      value: 'The reaction is added as the sender.',
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
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description: 'Emoji shortcode to react with.',
      placeholder: ':sparkling_heart:',
      required: true,
    }),
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'React As',
      icon: 'user',
      props: ['description', 'user'],
    },
    {
      key: 'reaction',
      display: 'section',
      label: 'Reaction',
      icon: 'tag',
      props: ['messageId', 'emoji'],
    },
  ],
  async run({ propsValue, auth }) {
    const authToken = auth.secret_text;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${getApiEndpoint(authToken)}/apis/v1/messages/react`,
      headers: {
        Authorization: `Bearer ${authToken.includes(':') ? authToken.split(':')[1] : authToken}`,
      },
      body: {
        messageId: propsValue.messageId,
        emoji: propsValue.emoji,
        sender: propsValue.user,
      },
    });
    return response.body;
  },
});

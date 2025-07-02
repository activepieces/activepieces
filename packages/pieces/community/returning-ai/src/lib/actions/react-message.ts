import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getApiEndpoint } from '../common';
import { returningAiAuth } from '../../index';

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
  displayName: 'React to Message',
  description: 'Add an emoji reaction to a specific message as a chosen user.',
  props: {
    description: Property.MarkDown({
      value:
        'This action allows you to add an emoji reaction to a message in any accessible channel on behalf of a specific user. The reaction will appear as if the selected user added it directly to the message.',
    }),
    user: Property.ShortText({
      displayName: 'Sender (Username or email)',
      description: 'The user account that will add the reaction',
      required: true,
    }),
    messageId: Property.ShortText({
      displayName: 'React to (Message ID)', 
      description: 'The ID of the message to react to',
      required: true,
    }),
    emoji: Property.ShortText({
      displayName: 'Reaction emoji',
      description: 'The emoji to react with (e.g. :sparkling_heart:)',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authToken = auth as string;
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

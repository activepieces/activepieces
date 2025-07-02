import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { getApiEndpoint } from '../common';
import { returningAiAuth } from '../../index';

/**
 * This action allows you to send messages to any accessible channel as a specific user.
 * The message will appear as if the selected user posted it directly.
 * 
 * When using this action, you need to provide:
 * 1. The username or email of the sender (who will appear to have sent the message)
 * 2. The channel where the message will be posted
 * 3. The content of the message
 * 
 * The API will handle posting the message to the specified channel with the appropriate sender.
 * 
 * @example
 * ```
 * // Example response
 * {
 *   "status": "success",
 *   "message": "Message sent successfully"
 * }
 * ```
 * 
 * @link https://dev.returning.ai/api-15023884
 */
export const sendMessage = createAction({
  auth:returningAiAuth,
  name: 'sendMessage',
  displayName: 'Send Channel Message',
  description: 'Posts a message to a specified channel as a chosen user',
  props: {
    description: Property.MarkDown({
      value:
        'This action allows you to send messages to any accessible channel as a specific user. The message will appear as if the selected user posted it directly.',
    }),
    user: Property.ShortText({
      displayName: 'Sender (Username or email)',
      description: 'The user account that will send the message',
      required: true,
    }),
    channel: Property.Dropdown({
      displayName: 'Channel',
      description: 'The channel where the message will be posted',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        const authToken = auth as string;

        if (!authToken) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        /**
         * Fetches the list of available channels from the Returning.ai API
         * @link https://dev.returning.ai/api-15023851
         */
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${getApiEndpoint(authToken)}/apis/v1/channels`,
          headers: {
            Authorization: `Bearer ${authToken.includes(':') ? authToken.split(':')[1] : authToken}`,
          },
        });

        if (response.body.status === 'success') {
          return {
            options: response.body.data.map(
              (channel: {
                _id: string;
                topic: string;
                channelType: string;
              }) => ({
                label: channel.topic,
                value: JSON.stringify({
                  id: channel._id,
                  type: channel.channelType,
                }),
              })
            ),
          };
        } else {
          return {
            disabled: true,
            options: [],
            placeholder: response.body.message,
          };
        }
      },
    }),
    dynamicFields: Property.DynamicProperties({
      displayName: 'Channel Fields',
      description: 'Additional fields based on channel type',
      required: true,
      refreshers: ['channel'],
      props: async ({ channel }) => {
        const properties: Record<string, any> = {};

        if (channel) {
          const channelData = JSON.parse(channel as unknown as string);
          if (channelData.type === 'forum') {
            properties['topicId'] = Property.ShortText({
              displayName: 'Topic ID',
              description:
                'The topic ID of the forum channel where the message will be posted',
              required: true,
            });
          }
        }

        return properties;
      },
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to be posted',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authToken = auth as string;
    const channelData = JSON.parse(propsValue.channel as string);
    const dynamicFields = propsValue.dynamicFields as DynamicPropsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${getApiEndpoint(authToken)}/apis/v1/messages/send`,
      headers: {
        Authorization: `Bearer ${authToken.includes(':') ? authToken.split(':')[1] : authToken}`,
      },
      body: {
        channelId: channelData.id,
        message: propsValue.message,
        sender: propsValue.user,
        ...(channelData.type === 'forum' && {
          forumTopicId: dynamicFields['topicId'],
        }),
      },
    });

    return response.body;
  },
});

import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, InputPropertyMap } from '@activepieces/pieces-framework';
import { getApiEndpoint } from '../common';
import { returningAiAuth } from '../auth';

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
  classification: 'WRITE',
  displayName: 'Send Channel Message',
  description: 'Posts a message to a channel as a chosen user.',
  audience: 'both',
  aiMetadata: { description: 'Posts a new message to a Returning.ai channel on behalf of a given user (identified by username or email), so the message appears as if that user sent it. Use to broadcast or announce content in a channel; supply message text, image URLs, or both (at least one is required), and for forum-type channels a topic ID is also required. Not idempotent: each call posts a new message.', idempotent: false },
  props: {
    description: Property.MarkDown({
      value: 'The message is posted as the sender, as if they wrote it.',
    }),
    user: Property.ShortText({
      displayName: 'Sender',
      description: 'Username or email of a community member.',
      placeholder: 'jane or jane@example.com',
      required: true,
    }),
    channel: Property.Dropdown({
      auth: returningAiAuth,
      displayName: 'Channel',
      description: 'Channel to post in.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        const authToken = auth?.secret_text;

        if (!authToken) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
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

          if (response.body.status !== 'success') {
            return {
              disabled: true,
              options: [],
              placeholder: response.body.message,
            };
          }

          const options = response.body.data.map(
            (channel: {
              _id: string;
              topic: string;
              channelType: string;
            }) => ({
              label:
                channel.channelType === 'forum'
                  ? `${channel.topic} (forum)`
                  : channel.topic,
              value: JSON.stringify({
                id: channel._id,
                type: channel.channelType,
              }),
            })
          );

          if (options.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No channels found.',
            };
          }

          return { options };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load channels. Check your connection.',
          };
        }
      },
    }),
    dynamicFields: Property.DynamicProperties({
      auth: returningAiAuth,
      displayName: 'Forum Topic',
      description: 'Forum channels need a topic to post in.',
      required: true,
      refreshers: ['channel'],
      props: async ({ channel }): Promise<InputPropertyMap> => {
        if (parseChannel(channel).type !== 'forum') {
          return {};
        }

        return {
          topicId: Property.ShortText({
            displayName: 'Topic ID',
            description: 'ID of the forum topic to post in.',
            required: true,
          }),
        };
      },
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Text to post, or leave empty to post images only.',
      required: false,
    }),
    images: Property.Array({
      displayName: 'Images',
      description: 'Public image URLs, one per entry.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const authToken = auth.secret_text;
    const channelData = parseChannel(propsValue.channel);

    const imageUrls = Array.isArray(propsValue.images)
      ? propsValue.images
          .filter((url): url is string => typeof url === 'string')
          .map((url) => url.trim())
          .filter((url) => url.length > 0)
      : [];

    const hasMessage = propsValue.message && propsValue.message.trim().length > 0;
    const hasImages = imageUrls.length > 0;

    if (!hasMessage && !hasImages) {
      return {
        status: 'error',
        message: 'Either "message" (text content) or "images" (image URLs) must be provided.',
        detail: 'Both fields are empty or missing.',
      };
    }

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
          forumTopicId: readTopicId(propsValue.dynamicFields),
        }),
        ...(hasImages && {
          images: imageUrls,
        }),
      },
    });

    return response.body;
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Post As',
      icon: 'user',
      props: ['description', 'user'],
    },
    {
      key: 'destination',
      display: 'section',
      label: 'Post To',
      icon: 'send',
      props: ['channel', 'dynamicFields'],
    },
    {
      key: 'content',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['message', 'images'],
    },
  ],
});

function parseChannel(value: unknown): { id?: unknown; type?: unknown } {
  if (typeof value !== 'string') {
    return {};
  }
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== 'object' || parsed === null) {
    return {};
  }
  return {
    id: 'id' in parsed ? parsed.id : undefined,
    type: 'type' in parsed ? parsed.type : undefined,
  };
}

function readTopicId(value: unknown): unknown {
  if (typeof value === 'object' && value !== null && 'topicId' in value) {
    return value.topicId;
  }
  return undefined;
}

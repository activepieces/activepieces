import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { webexAuth } from '../common/auth';

export const createMessage = createAction({
  auth: webexAuth,
  name: 'createMessage',
  displayName: 'Create Message',
  description:
    'Post a plain text or rich text message to a Webex room or send a direct message',
  props: {
    messageType: Property.StaticDropdown({
      displayName: 'Message Type',
      description:
        'Choose between sending to a room or a direct message to a person',
      required: true,
      options: {
        options: [
          { label: 'Room Message', value: 'room' },
          { label: 'Direct Message', value: 'direct' },
        ],
      },
    }),
    destination: Property.DynamicProperties({
      displayName: 'Destination',
      required: true,
      refreshers: ['messageType'],
      async props({ messageType }): Promise<DynamicPropsValue> {
        const type = messageType as unknown as string;
        if (type === 'room') {
          return {
            roomId: Property.ShortText({
              displayName: 'Room ID',
              description: 'The room ID where to post the message',
              required: true,
            }),
          };
        } else {
          return {
            toPersonId: Property.ShortText({
              displayName: 'Person ID',
              description: 'The person ID of the recipient',
              required: false,
            }),
            toPersonEmail: Property.ShortText({
              displayName: 'Person Email',
              description: 'The email address of the recipient',
              required: false,
            }),
          };
        }
      },
    }),
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'The message to send',
      required: true,
    }),
    markdown: Property.LongText({
      displayName: 'Message Markdown',
      description:
        'The message in Markdown format for rich text. If provided, text will be used as alternate text',
      required: false,
    }),
    parentId: Property.ShortText({
      displayName: 'Parent Message ID',
      description: 'The parent message ID to reply to (optional)',
      required: false,
    }),
    files: Property.Array({
      displayName: 'File URLs',
      description: 'Public URLs to files to attach (only one file per message)',
      properties: {
        url: Property.ShortText({
          displayName: 'File URL',
          description: 'Public URL to the file',
          required: true,
        }),
      },
      required: false,
    }),
  },
  async run(context) {
    const { messageType, destination, text, markdown, parentId } =
      context.propsValue;

    const files = context.propsValue.files as { url: string }[] | undefined;

    const body: Record<string, unknown> = {
      text,
    };

    if (messageType === 'room') {
      const roomId = destination['roomId'] as string;
      body['roomId'] = roomId;
    } else {
      const toPersonId = destination['toPersonId'] as string | undefined;
      const toPersonEmail = destination['toPersonEmail'] as string | undefined;

      if (!toPersonId && !toPersonEmail) {
        throw new Error(
          'Either Person ID or Person Email is required for direct messages'
        );
      }

      if (toPersonId) {
        body['toPersonId'] = toPersonId;
      }
      if (toPersonEmail) {
        body['toPersonEmail'] = toPersonEmail;
      }
    }

    if (markdown) {
      body['markdown'] = markdown;
    }

    if (parentId) {
      body['parentId'] = parentId;
    }

    if (files && files.length > 0) {
      body['files'] = [files[0].url];
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/messages',
      body
    );

    return response;
  },
});

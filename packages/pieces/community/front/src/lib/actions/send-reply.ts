import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendReply = createAction({
  auth: frontAuth,
  name: 'sendReply',
  displayName: 'Send Reply',
  description: 'Send a reply to a conversation in Front.',
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to reply to.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Message Body',
      description: 'The content of the reply message.',
      required: true,
    }),
    author_id: Property.ShortText({
      displayName: 'Author ID',
      description: 'The ID of the teammate sending the reply.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the reply (for email channels).',
      required: false,
    }),
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The channel to send the reply from (required for some channels).',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'List of attachment URLs.',
      required: false,
      properties: {
        item: Property.ShortText({
          displayName: 'Attachment URL',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { conversation_id, body, author_id, subject, channel_id, attachments } = propsValue;
    const path = `/conversations/${conversation_id}/messages`;
    const requestBody: Record<string, unknown> = { body };

    if (author_id) requestBody['author_id'] = author_id;
    if (subject) requestBody['subject'] = subject;
    if (channel_id) requestBody['channel_id'] = channel_id;
    if (attachments) requestBody['attachments'] = attachments;

    return await makeRequest(auth.access_token, HttpMethod.POST, path, requestBody);
  },
});
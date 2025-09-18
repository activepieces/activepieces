import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createDraftReply = createAction({
  auth: frontAuth,
  name: 'createDraftReply',
  displayName: 'Create Draft Reply',
  description: 'Create a draft reply to an existing conversation (subject/quote etc.) without sending immediately.',
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to reply to.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Message Body',
      description: 'The content of the draft reply.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the draft reply (for email channels).',
      required: false,
    }),
    author_id: Property.ShortText({
      displayName: 'Author ID',
      description: 'The ID of the teammate creating the draft reply.',
      required: false,
    }),
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The channel to send the draft reply from (required for some channels).',
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
    const { conversation_id, body, subject, author_id, channel_id, attachments } = propsValue;
    const path = `/conversations/${conversation_id}/drafts`;
    const requestBody: Record<string, unknown> = { body };
    if (subject) requestBody['subject'] = subject;
    if (author_id) requestBody['author_id'] = author_id;
    if (channel_id) requestBody['channel_id'] = channel_id;
    if (attachments) requestBody['attachments'] = attachments;

    return await makeRequest(auth.access_token, HttpMethod.POST, path, requestBody);
  },
});
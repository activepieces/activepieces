import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { channelIdDropdown, conversationIdDropdown, teammateIdDropdown } from '../common/dropdown';

export const sendReply = createAction({
  auth: frontAuth,
  name: 'sendReply',
  displayName: 'Send Reply',
  description: 'Send a reply to a conversation in Front.',
  props: {
    conversation_id: conversationIdDropdown,
    body: Property.LongText({
      displayName: 'Message Body',
      description: 'The content of the reply message.',
      required: true,
    }),
    author_id: teammateIdDropdown,
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the reply (for email channels).',
      required: false,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'List of recipient handles (email addresses, etc.).',
      required: true,
      properties: {
        item: Property.ShortText({
          displayName: 'Recipient',
          required: true,
        }),
      },
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'List of CC recipient handles.',
      required: false,
      properties: {
        item: Property.ShortText({
          displayName: 'CC Recipient',
          required: true,
        }),
      },
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'List of BCC recipient handles.',
      required: false,
      properties: {
        item: Property.ShortText({
          displayName: 'BCC Recipient',
          required: true,
        }),
      },
    }),
    channel_id: channelIdDropdown,
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
    const { conversation_id, body, author_id, subject, channel_id, attachments, to, cc, bcc } = propsValue;
    const path = `/conversations/${conversation_id}/messages`;
    const requestBody: Record<string, unknown> = { body };

    if (author_id) requestBody['author_id'] = author_id;
    if (subject) requestBody['subject'] = subject;
    if (to) requestBody['to'] = to;
    if (cc) requestBody['cc'] = cc;
    if (bcc) requestBody['bcc'] = bcc;
    if (channel_id) requestBody['channel_id'] = channel_id;
    if (attachments) requestBody['attachments'] = attachments;

    return await makeRequest(auth.access_token, HttpMethod.POST, path, requestBody);
  },
});
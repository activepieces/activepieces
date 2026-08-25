import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  channelIdDropdown,
  conversationIdDropdown,
  teammateIdDropdown,
} from '../common/dropdown';

export const sendReply = createAction({
  auth: frontAuth,
  name: 'sendReply',
  displayName: 'Send Reply',
  description: 'Send a reply to a conversation in Front.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a customer-facing reply within an existing Front conversation identified by conversation ID. Pick this to respond in an ongoing thread; use "Send Message" to start a new conversation and "Add Comment" for an internal note. Not idempotent: each call sends another reply.',
    idempotent: false,
  },
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
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'List of CC recipient handles.',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'List of BCC recipient handles.',
      required: false,
    }),
    channel_id: channelIdDropdown,
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'List of attachment URLs.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      conversation_id,
      body,
      author_id,
      subject,
      channel_id,
      attachments,
      to,
      cc,
      bcc,
    } = propsValue;
    const path = `/conversations/${conversation_id}/messages`;
    const requestBody: Record<string, unknown> = { body };

    if (author_id) requestBody['author_id'] = author_id;
    if (subject) requestBody['subject'] = subject;
    if (to) requestBody['to'] = to;
    if (cc) requestBody['cc'] = cc;
    if (bcc) requestBody['bcc'] = bcc;
    if (channel_id) requestBody['channel_id'] = channel_id;
    if (attachments) requestBody['attachments'] = attachments;

    return await makeRequest(auth, HttpMethod.POST, path, requestBody);
  },
});

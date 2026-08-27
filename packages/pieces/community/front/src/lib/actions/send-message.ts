import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest, makeMultipartRequest } from '../common/client';
import {
  attachmentsProperty,
  buildMultipartBody,
  toApFiles,
} from '../common/attachments';
import { HttpMethod } from '@activepieces/pieces-common';
import { channelIdDropdown, tagIdsDropdown } from '../common/dropdown';

export const sendMessage = createAction({
  auth: frontAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description:
    'Send a new message (starts a conversation) with subject, recipients, body, attachments, tags, etc.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send an outbound message through a Front channel, creating a brand-new conversation. Pick this to initiate first contact with recipients (by handle) rather than answering an existing thread; use "Send Reply" to respond within an existing conversation. Not idempotent: each call sends a new message and starts a new conversation.',
    idempotent: false,
  },
  props: {
    channel_id: channelIdDropdown,
    to: Property.Array({
      displayName: 'To',
      description: 'List of recipient handles (email addresses, etc.).',
      required: true,
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
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the message.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The body of the message.',
      required: true,
    }),
    attachments: attachmentsProperty,
    tag_ids: tagIdsDropdown,
  },
  async run({ auth, propsValue }) {
    const { channel_id, to, cc, bcc, subject, body, attachments, tag_ids } =
      propsValue;
    const requestBody: Record<string, unknown> = {
      channel_id,
      to,
      body,
    };
    if (cc) requestBody['cc'] = cc;
    if (bcc) requestBody['bcc'] = bcc;
    if (subject) requestBody['subject'] = subject;
    if (tag_ids) requestBody['tag_ids'] = tag_ids;

    // A message with files has to go out as multipart; Front drops the
    // attachments from a JSON request without complaining.
    const files = toApFiles(attachments);
    if (files.length > 0) {
      return await makeMultipartRequest(
        auth,
        HttpMethod.POST,
        `/channels/${channel_id}/messages`,
        buildMultipartBody(requestBody, attachments)
      );
    }

    return await makeRequest(auth, HttpMethod.POST, `/channels/${channel_id}/messages`, requestBody);
  },
});

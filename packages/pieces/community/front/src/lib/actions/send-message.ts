import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { channelIdDropdown, tagIdsDropdown } from '../common/dropdown';

export const sendMessage = createAction({
  auth: frontAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description:
    'Send a new message (starts a conversation) with subject, recipients, body, attachments, tags, etc.',
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
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'List of attachment URLs.',
      required: false,
    }),
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
    if (attachments) requestBody['attachments'] = attachments;
    if (tag_ids) requestBody['tag_ids'] = tag_ids;

    return await makeRequest(
      auth,
      HttpMethod.POST,
      `/channels/${channel_id}/messages`,
      requestBody
    );
  },
});

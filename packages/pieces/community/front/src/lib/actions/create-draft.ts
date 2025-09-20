import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { channelIdDropdown } from '../common/dropdown';

export const createDraft = createAction({
  auth: frontAuth,
  name: 'createDraft',
  displayName: 'Create Draft',
  description: 'Create a draft message in Front.',
  props: {
    channel_id: channelIdDropdown,
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
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the draft.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The body of the draft message.',
      required: true,
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
    const { channel_id, to, cc, bcc, subject, body, attachments } = propsValue;
    const requestBody: Record<string, unknown> = {
      channel_id,
      to,
      body,
    };
    if (cc) requestBody['cc'] = cc;
    if (bcc) requestBody['bcc'] = bcc;
    if (subject) requestBody['subject'] = subject;
    if (attachments) requestBody['attachments'] = attachments;

    return await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/drafts',
      requestBody
    );
  },
});

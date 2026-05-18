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
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'Mode of the draft reply',
      required: true,
      options: {
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Shared', value: 'shared' },
        ],
      },
      defaultValue: 'private',
    }),
    signature_id: Property.ShortText({
      displayName: 'Signature ID',
      description:
        'The ID of the signature to use for the draft reply (if applicable).',
      required: false,
    }),
    should_add_default_signature: Property.Checkbox({
      displayName: 'Add Default Signature',
      description:
        'Whether to append the default signature to the draft reply (if applicable).',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      channel_id,
      to,
      cc,
      bcc,
      subject,
      body,
      attachments,
      mode,
      signature_id,
      should_add_default_signature,
    } = propsValue;
    const requestBody: Record<string, unknown> = {
      channel_id,
      to,
      body,
    };
    if (cc) requestBody['cc'] = cc;
    if (bcc) requestBody['bcc'] = bcc;
    if (subject) requestBody['subject'] = subject;
    if (attachments) requestBody['attachments'] = attachments;
    if (mode) requestBody['mode'] = mode;
    if (signature_id) requestBody['signature_id'] = signature_id;
    if (should_add_default_signature !== undefined)
      requestBody['should_add_default_signature'] =
        should_add_default_signature;

    return await makeRequest(
      auth,
      HttpMethod.POST,
      `/channels/${channel_id}/drafts`,
      requestBody
    );
  },
});

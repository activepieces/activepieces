import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { spreadIfDefined } from '@activepieces/shared';

import { mailerooAuth } from '../auth';
import { buildAttachmentList, toEmailObjects } from '../common';

export const sendEmail = createAction({
  auth: mailerooAuth,
  name: 'sendEmail',
  displayName: 'Send Email',
  description: 'Sends an email using the Maileroo API.',
  props: {
    from: Property.ShortText({
      displayName: 'From Email',
      description: 'Sender email address. Must be from a verified domain.',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      description: 'Sender display name.',
      required: false,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject (max 255 characters).',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'Carbon copy recipients.',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'Blind carbon copy recipients.',
      required: false,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Email address to receive replies.',
      required: false,
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      required: true,
      defaultValue: 'text',
      options: {
        disabled: false,
        options: [
          { label: 'Plain Text', value: 'text' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
    content: Property.ShortText({
      displayName: 'Content',
      description: 'HTML is only allowed if you selected HTML as type',
      required: true,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'File',
          required: true,
        }),
      },
    }),
    tracking: Property.Checkbox({
      displayName: 'Enable Tracking',
      description: 'Enable open and click tracking. Defaults to account settings if not specified.',
      required: false,
    }),
  },
  async run(context) {
    const {
      from,
      from_name,
      to,
      subject,
      cc,
      bcc,
      reply_to,
      content,
      content_type,
      tracking,
    } = context.propsValue;

    const attachments = context.propsValue.attachments as Array<{ file: ApFile }> ?? []

    const mappedAttachments = buildAttachmentList(attachments ?? []);

    const body = {
      from: {
        address: from,
        ...spreadIfDefined('display_name', from_name),
      },
      to: toEmailObjects(to),
      subject,
      ...spreadIfDefined('cc', cc && cc.length > 0 ? toEmailObjects(cc) : undefined),
      ...spreadIfDefined('bcc', bcc && bcc.length > 0 ? toEmailObjects(bcc) : undefined),
      ...spreadIfDefined('reply_to', reply_to ? [{ address: reply_to }] : undefined),
      ...(content_type === 'html' ? { html: content } : { plain: content }),
      ...spreadIfDefined('tracking', tracking ?? undefined),
      ...spreadIfDefined('attachments', mappedAttachments.length > 0 ? mappedAttachments : undefined),
    };

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://smtp.maileroo.com/api/v2/emails',
      body,
      headers: {
        'X-API-Key': context.auth.props.apiKey,
        'Content-Type': 'application/json',
      },
    });

    return res.body;
  },
});



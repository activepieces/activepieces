import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { spreadIfDefined } from '@activepieces/shared';

import { mailerooAuth } from '../auth';
import { buildAttachmentList, toEmailObjects } from '../common';

export const sendFromTemplate = createAction({
  auth: mailerooAuth,
  name: 'sendFromTemplate',
  displayName: 'Send Email using Template',
  description: 'Sends an email from an existing template.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends an email through Maileroo whose body is rendered from a saved template, passing key-value template data to fill its {{ variable }} placeholders (subject also supports these). Choose this over the plain send action when the message content lives in a Maileroo template; supports CC/BCC, reply-to, attachments, and tracking. Requires a numeric template_id from the Templates dashboard, and the sender address must be on a verified domain. Not idempotent: each call dispatches a new email.',
    idempotent: false,
  },
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
      description: 'Email subject (max 255 characters). Supports template variables using {{ variable_name }} syntax.',
      required: true,
    }),
    template_id: Property.Number({
      displayName: 'Template ID',
      description: 'The ID of the template to use (found in the Templates dashboard).',
      required: true,
    }),
    template_data: Property.Object({
      displayName: 'Template Data',
      description:
        'Key-value pairs to fill template variables. The string {{ name }} in the template will be replaced with the value of "name".',
      required: false,
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
      template_id,
      template_data,
      cc,
      bcc,
      reply_to,
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
      template_id,
      ...spreadIfDefined('template_data', template_data),
      ...spreadIfDefined('cc', cc && cc.length > 0 ? toEmailObjects(cc) : undefined),
      ...spreadIfDefined('bcc', bcc && bcc.length > 0 ? toEmailObjects(bcc) : undefined),
      ...spreadIfDefined('reply_to', reply_to ? [{ address: reply_to }] : undefined),
      ...spreadIfDefined('tracking', tracking ?? undefined),
      ...spreadIfDefined('attachments', mappedAttachments.length > 0 ? mappedAttachments : undefined),
    };

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://smtp.maileroo.com/api/v2/emails/template',
      body,
      headers: {
        'X-API-Key': context.auth.props.apiKey,
        'Content-Type': 'application/json',
      },
    });

    return res.body;
  },
});

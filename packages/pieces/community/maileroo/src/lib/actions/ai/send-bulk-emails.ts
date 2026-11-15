import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooProps } from '../../common/props';
import { mailerooSendBulkEmailsOutputSchema } from '../../output-schemas';

export const mailerooSendBulkEmails = createAction({
  auth: mailerooAuth,
  name: 'maileroo_send_bulk_emails',
  outputSchema: mailerooSendBulkEmailsOutputSchema,
  displayName: 'Send Bulk Emails',
  description: 'Sends up to 500 personalized emails in one request.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Sends many emails in one call, each with its own recipients and template_data, sharing one subject and body (HTML, plain text or a template ID). Messages is a JSON array of up to 500 objects like {"from":{"address":"a@x.com","display_name":"A"},"to":[{"address":"b@y.com"}],"template_data":{"first_name":"B"}}; Subject and body support {{ variable }} placeholders. Returns one reference ID per message. Use maileroo_send_email for a single email. Requires a Sending Key connection. Not idempotent: each call sends every message again.',
    idempotent: false,
  },
  props: {
    subject: Property.ShortText({ displayName: 'Subject', description: 'Shared subject, at most 255 characters. Supports {{ variable }} placeholders.', required: true }),
    messages: Property.Json({ displayName: 'Messages', description: 'JSON array of up to 500 message objects with from, to, optional cc, bcc, reply_to, reference_id and template_data.', required: true }),
    template_id: Property.Number({ displayName: 'Template ID', description: 'Saved template ID from maileroo_list_templates. Use this or HTML/Plain Text.', required: false }),
    html: Property.LongText({ displayName: 'HTML Body', description: 'Shared HTML body with {{ variable }} placeholders.', required: false }),
    plain: Property.LongText({ displayName: 'Plain Text Body', description: 'Shared plain text body with {{ variable }} placeholders.', required: false }),
    tracking: mailerooProps.tracking,
    tags: Property.Json({ displayName: 'Tags', description: 'Key-value tags as a JSON object.', required: false }),
    headers: Property.Json({ displayName: 'Custom Headers', description: 'Custom headers as a JSON object.', required: false }),
  },
  async run(context) {
    const { subject, messages, template_id, html, plain, tracking, tags, headers } = context.propsValue;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 500) {
      throw new Error('Messages must be a JSON array with 1 to 500 items.');
    }
    if (template_id === undefined && !html && !plain) {
      throw new Error('Provide a Template ID, an HTML Body, or a Plain Text Body.');
    }
    const response = await mailerooClient.emailRequest<{ reference_ids: string[] }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/emails/bulk',
      body: {
        subject,
        messages,
        ...spreadIfDefined('template_id', template_id),
        ...spreadIfDefined('html', html),
        ...spreadIfDefined('plain', plain),
        ...spreadIfDefined('tracking', mailerooClient.optionalBoolean(tracking)),
        ...spreadIfDefined('tags', tags),
        ...spreadIfDefined('headers', headers),
      },
    });
    return { message: response.message, reference_ids: response.data.reference_ids };
  },
});

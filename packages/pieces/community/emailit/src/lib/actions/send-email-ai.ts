import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';
import { emailitSend } from '../common/send';

export const sendEmailAiAction = createAction({
  auth: emailitAuth,
  name: 'send_email_ai',
  displayName: 'Send Email (AI)',
  description: 'Send an email through Emailit and return the created email.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends one email through Emailit from an address on a verified sending domain to up to 50 To recipients (CC and BCC take up to 50 each), with an HTML body, a plain-text body, both, or a stored template with variables, optionally scheduled for later. Returns the email (id, ids per recipient, status). Not idempotent: a repeat call sends again unless the same idempotency_key is given within 24 hours.',
    idempotent: false,
  },
  outputSchema: emailitSchemas.sentEmail,
  props: {
    to: emailitProps.recipientList({ displayName: 'To', description: 'Recipient addresses, up to 50.', required: true }),
    from_email: Property.ShortText({ displayName: 'Sender Email', description: 'Address on a verified sending domain of the workspace.', required: true }),
    from_name: Property.ShortText({ displayName: 'Sender Name', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Required unless template is set.', required: false }),
    html: Property.LongText({ displayName: 'HTML Body', required: false }),
    text: Property.LongText({ displayName: 'Plain-Text Body', required: false }),
    cc: emailitProps.recipientList({ displayName: 'CC', description: 'Up to 50.', required: false }),
    bcc: emailitProps.recipientList({ displayName: 'BCC', description: 'Up to 50.', required: false }),
    reply_to: emailitProps.recipientList({ displayName: 'Reply-To', description: 'Addresses for replies.', required: false }),
    template: Property.ShortText({ displayName: 'Template', description: 'Template ID (tem_…) or alias.', required: false }),
    variables: Property.Json({ displayName: 'Template Variables', description: 'JSON object of placeholder values.', required: false }),
    scheduled_at: Property.ShortText({ displayName: 'Send At', description: 'ISO 8601 date-time with time zone, e.g. 2026-10-02T09:00:00Z. Empty sends now.', required: false }),
    idempotency_key: emailitProps.idempotencyKey(),
  },
  async run({ auth, propsValue }) {
    const response = await emailitSend.send({
      auth,
      input: {
        to: propsValue.to,
        cc: propsValue.cc,
        bcc: propsValue.bcc,
        replyTo: propsValue.reply_to,
        fromName: propsValue.from_name,
        fromEmail: propsValue.from_email,
        subject: propsValue.subject,
        html: propsValue.html,
        text: propsValue.text,
        template: propsValue.template,
        variables: propsValue.variables,
        scheduledAt: propsValue.scheduled_at,
        idempotencyKey: propsValue.idempotency_key,
      },
    });
    return response.body;
  },
});

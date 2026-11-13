import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';
import { emailitSend } from '../common/send';

export const sendEmailAction = createAction({
  auth: emailitAuth,
  name: 'send_email',
  classification: 'WRITE',
  displayName: 'Send Email',
  description: 'Send an email to one or more recipients via Emailit.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sends a transactional email through Emailit from an address on a verified sending domain to up to 50 To recipients (each of CC and BCC also takes up to 50), as HTML or plain text or from a stored template, optionally scheduled. Returns the HTTP status, response headers and the email in body (body.id is the email ID). Not idempotent: a repeat call sends again unless the same Idempotency Key is given within 24 hours.',
    idempotent: false,
  },
  outputSchema: emailitSchemas.sendEmailLegacy,
  props: {
    to: emailitProps.recipientList({
      displayName: 'To',
      description: 'Recipient email addresses, e.g. ada@example.com or Ada Lovelace <ada@example.com>. Up to 50 here, and up to 50 each in CC and BCC.',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name recipients will see in their inbox, e.g. "Acme Support". If left blank, only the email address is shown.',
      required: false,
    }),
    from_email: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Email address to send from. It must be on a verified sending domain of your Emailit workspace.',
      required: true,
    }),
    cc: emailitProps.recipientList({ displayName: 'CC', description: 'Send a visible copy to these addresses. Up to 50.', required: false }),
    bcc: emailitProps.recipientList({ displayName: 'BCC', description: "Send a hidden copy to these addresses. Other recipients won't see them. Up to 50.", required: false }),
    reply_to: Property.ShortText({
      displayName: 'Reply-To',
      description: 'Where replies go. Defaults to the sender email if left blank. Separate several addresses with commas.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: "The subject line shown in the recipient's inbox. Required unless you send a template.",
      required: false,
    }),
    content_type: Property.StaticDropdown<'text' | 'html'>({
      displayName: 'Content Type',
      required: true,
      defaultValue: 'html',
      options: {
        disabled: false,
        options: [
          { label: 'Plain Text', value: 'text' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Email Body',
      description: 'The message body. Use Plain Text for simple messages or HTML for rich formatting. Required unless you send a template.',
      required: false,
    }),
    plain_text: Property.LongText({
      displayName: 'Plain-Text Version',
      description: 'Optional, for HTML emails: a plain-text version sent alongside the HTML. Recommended for deliverability.',
      required: false,
    }),
    headers: Property.Object({
      displayName: 'Custom Headers',
      description: 'Add custom email headers as key-value pairs, e.g. X-Campaign-ID: welcome. Line breaks are not allowed.',
      required: false,
    }),
    ...emailitProps.sendingProps(),
  },
  async run({ auth, propsValue }) {
    const isText = propsValue.content_type === 'text';
    return emailitSend.send({
      auth,
      input: {
        to: propsValue.to,
        cc: propsValue.cc,
        bcc: propsValue.bcc,
        replyTo: propsValue.reply_to,
        fromName: propsValue.from_name,
        fromEmail: propsValue.from_email,
        subject: propsValue.subject,
        html: isText ? undefined : propsValue.content,
        text: isText ? propsValue.content : propsValue.plain_text,
        template: propsValue.template,
        variables: propsValue.variables,
        headers: propsValue.headers,
        meta: propsValue.meta,
        scheduledAt: propsValue.scheduled_at,
        tracking: propsValue.tracking,
        attachmentUrls: propsValue.attachments,
        attachmentFile: propsValue.attachment_file,
        idempotencyKey: propsValue.idempotency_key,
      },
    });
  },
});

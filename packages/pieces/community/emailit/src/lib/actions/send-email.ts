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
  propertyGroups: [
    { key: 'recipients', display: 'section', label: 'Recipients', icon: 'users', props: ['to', 'cc', 'bcc', 'reply_to'] },
    { key: 'sender', display: 'section', label: 'Sender', icon: 'user', props: ['from_name', 'from_email'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['subject', 'content_type', 'content', 'plain_text'] },
    { key: 'template', display: 'section', label: 'Template', icon: 'file', props: ['template', 'variables'] },
    { key: 'attachments', display: 'section', label: 'Attachments', icon: 'paperclip', props: ['attachments', 'attachment_file'] },
    { key: 'delivery', display: 'section', label: 'Delivery', icon: 'calendar', props: ['scheduled_at', 'tracking'] },
  ],
  props: {
    to: emailitProps.recipientList({
      displayName: 'To',
      description: 'Up to 50. An address or Name <address>.',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Shown in the inbox. Empty shows only the address.',
      placeholder: 'Acme Support',
      width: 'half',
      required: false,
    }),
    from_email: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Must be on a verified sending domain.',
      placeholder: 'support@acme.com',
      width: 'half',
      required: true,
    }),
    cc: emailitProps.recipientList({ displayName: 'CC', description: 'Visible copies, up to 50.', required: false }),
    bcc: emailitProps.recipientList({ displayName: 'BCC', description: 'Hidden copies, up to 50.', required: false }),
    reply_to: Property.ShortText({
      displayName: 'Reply-To',
      description: 'Where replies go. Empty: the sender. Separate several with commas.',
      placeholder: 'help@acme.com',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Required unless you use a template.',
      placeholder: 'Your order has shipped',
      required: false,
    }),
    content_type: Property.StaticDropdown<'text' | 'html'>({
      displayName: 'Body Type',
      required: true,
      defaultValue: 'html',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          { label: 'Plain text', value: 'text', description: 'Simple', icon: 'text' },
          { label: 'HTML', value: 'html', description: 'Rich + styled', icon: 'code' },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Email Body',
      description: 'Required unless you use a template.',
      required: false,
    }),
    plain_text: Property.LongText({
      displayName: 'Plain-Text Version',
      description: 'Sent with an HTML body. Ignored for plain text.',
      required: false,
    }),
    headers: Property.Object({
      displayName: 'Custom Headers',
      description: 'Extra email headers, e.g. X-Campaign-ID: welcome.',
      advanced: true,
      required: false,
    }),
    ...sendingFields(),
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

function sendingFields() {
  const sending = emailitProps.sendingProps();
  return {
    ...sending,
    meta: { ...sending.meta, advanced: true },
    idempotency_key: {
      ...sending.idempotency_key,
      displayName: 'Deduplication Key',
      description: 'Reruns with the same key within 24 hours do not send again.',
      placeholder: 'order-1042',
      advanced: true,
    },
  };
}

import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';
import { emailitValues } from '../common/values';

export const forwardEmailAction = createAction({
  auth: emailitAuth,
  name: 'forward_email',
  displayName: 'Forward Email',
  description: 'Send a copy of a sent email to new recipients.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Forwards an outgoing Emailit email to up to 50 new recipients as a new send, either as a plain resend or with a "Forwarded message" block and an optional note. Each recipient costs a credit; the workspace can forward at most 3 emails per hour. Not idempotent unless the same idempotency_key is given within 24 hours.',
    idempotent: false,
  },
  outputSchema: emailitSchemas.forwarded,
  propertyGroups: [
    { key: 'email', display: 'section', label: 'Email', icon: 'inbox', props: ['email_id', 'to'] },
    { key: 'header', display: 'section', label: 'Forward Header', icon: 'reply', props: ['include_headers', 'comment'] },
    { key: 'overrides', display: 'section', label: 'Overrides', icon: 'sliders', props: ['from', 'subject'] },
  ],
  props: {
    email_id: emailitProps.emailId({ description: 'The sent email to forward.' }),
    to: emailitProps.recipientList({ displayName: 'To', description: 'New recipients, up to 50.', required: true }),
    include_headers: Property.Checkbox({ displayName: 'Add Forward Header', description: 'Shows the original sender, date and subject on top.', required: false, defaultValue: false }),
    comment: Property.LongText({ displayName: 'Note', description: 'Plain text above the message. Needs Add Forward Header.', required: false }),
    from: Property.ShortText({ displayName: 'Sender', description: 'Empty: the original sender.', placeholder: 'support@acme.com', width: 'half', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Empty: the original subject.', width: 'half', required: false }),
    idempotency_key: {
      ...emailitProps.idempotencyKey(),
      displayName: 'Deduplication Key',
      description: 'Reruns with the same key within 24 hours do not send again.',
      placeholder: 'order-1042',
      advanced: true,
    },
  },
  async run({ auth, propsValue }) {
    const body = emailitValues.compact({
      to: emailitValues.recipients({ value: propsValue.to, label: 'To', required: true }),
      include_headers: propsValue.include_headers === true ? true : undefined,
      comment: propsValue.include_headers === true ? emailitValues.optionalText(propsValue.comment) : undefined,
      from: emailitValues.singleLine({ value: propsValue.from, label: 'Sender' }),
      subject: emailitValues.singleLine({ value: propsValue.subject, label: 'Subject' }),
    });
    try {
      return await emailitClient.request({
        auth,
        method: HttpMethod.POST,
        path: `/emails/${emailitClient.seg({ value: propsValue.email_id, label: 'Email ID' })}/forward`,
        body,
        idempotencyKey: emailitValues.idempotencyKey(propsValue.idempotency_key),
        redactBody: true,
      });
    } catch (error) {
      return emailitClient.rethrowWithHint({
        error,
        hints: { 404: 'Email not found.', 422: 'Only outgoing emails whose content is still kept can be forwarded.', 429: 'Forward limit reached (3 per hour per workspace).' },
      });
    }
  },
});

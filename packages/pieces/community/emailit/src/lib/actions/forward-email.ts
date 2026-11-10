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
  props: {
    email_id: emailitProps.emailId({ description: 'ID of the outgoing email to forward.' }),
    to: emailitProps.recipientList({ displayName: 'To', description: 'New recipients, up to 50.', required: true }),
    include_headers: Property.Checkbox({ displayName: 'Add Forwarded-Message Header', description: 'Adds the original sender, date and subject above the content, with your note.', required: false, defaultValue: false }),
    comment: Property.LongText({ displayName: 'Note', description: 'Plain-text note above the forwarded message (only with the header option).', required: false }),
    from: Property.ShortText({ displayName: 'Sender', description: 'Optional. Defaults to the original sender.', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Optional. Defaults to the original subject.', required: false }),
    idempotency_key: emailitProps.idempotencyKey(),
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

import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';
import { emailitValues } from '../common/values';

export const rescheduleEmailAction = createAction({
  auth: emailitAuth,
  name: 'update_scheduled_email',
  displayName: 'Reschedule Email',
  description: 'Change the send time of a scheduled email.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a scheduled Emailit email to a new send time. Works only while the email is still scheduled and more than 3 minutes from its current send time, and the new time must be over 3 minutes ahead. Content cannot change. Repeating with the same time leaves the same result.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.rescheduled,
  props: {
    email_id: emailitProps.emailId({ description: 'ID of the scheduled email. For a send to several recipients, each recipient has its own ID.' }),
    scheduled_at: Property.DateTime({ displayName: 'New Send Time', description: 'ISO 8601 with time zone; at least 3 minutes from now.', required: true }),
  },
  async run({ auth, propsValue }) {
    const scheduledAt = emailitValues.dateTime(propsValue.scheduled_at);
    if (scheduledAt === undefined) {
      throw new Error('New Send Time is required.');
    }
    try {
      return await emailitClient.request({
        auth,
        method: HttpMethod.POST,
        path: `/emails/${emailitClient.seg({ value: propsValue.email_id, label: 'Email ID' })}`,
        body: { scheduled_at: scheduledAt },
        safeToRetry: true,
      });
    } catch (error) {
      return emailitClient.rethrowWithHint({
        error,
        hints: { 404: 'Email not found.', 422: 'The email can no longer be rescheduled (not scheduled, or due within 3 minutes), or the new time is too soon.' },
      });
    }
  },
});

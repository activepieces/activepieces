import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { rescheduleEmailOutputSchema } from '../output-schemas';

export const rescheduleEmail = createAction({
  name: 'reschedule_email',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Reschedule Email',
  outputSchema: rescheduleEmailOutputSchema,
  description: 'Update the send time of a scheduled email',
  audience: 'both',
  aiMetadata: { description: 'Changes the future send time of an already scheduled email, identified by its Resend email ID. Use this to move a pending send to a new time without cancelling and recreating it. Idempotent when called with the same target time; requires an ISO 8601 date-time and only works while the email is still scheduled.', idempotent: true },
  propertyGroups: [
    {
      key: 'schedule',
      display: 'section',
      label: 'Scheduled Email',
      icon: 'calendar',
      props: ['info', 'email_id', 'scheduled_at'],
    },
  ],
  props: {
    info: Property.MarkDown({
      value: 'Only emails that have not been sent yet can be rescheduled.',
      variant: MarkdownVariant.INFO,
    }),
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID returned by Send Email or List Sent Emails.',
      placeholder: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
      required: true,
    }),
    scheduled_at: Property.ShortText({
      displayName: 'New Send Time',
      description: 'Date and time in ISO 8601 format.',
      placeholder: '2026-12-01T10:00:00Z',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.PATCH, path: `/emails/${propsValue.email_id}`, body: { scheduled_at: propsValue.scheduled_at } });
  },
});

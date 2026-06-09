import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const rescheduleEmail = createAction({
  name: 'reschedule_email',
  auth: resendAuth,
  displayName: 'Reschedule Email',
  description: 'Update the send time of a scheduled email',
  audience: 'both',
  aiMetadata: { description: 'Changes the future send time of an already scheduled email, identified by its Resend email ID. Use this to move a pending send to a new time without cancelling and recreating it. Idempotent when called with the same target time; requires an ISO 8601 date-time and only works while the email is still scheduled.', idempotent: true },
  props: {
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID of the scheduled email to reschedule. Use "List Sent Emails" to find it.',
      required: true,
    }),
    scheduled_at: Property.ShortText({
      displayName: 'New Send Time',
      description: 'ISO 8601 date-time for when to send the email, e.g. 2024-12-01T10:00:00Z',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{ object: string; id: string }>({
      method: HttpMethod.PATCH,
      url: `https://api.resend.com/emails/${propsValue.email_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
      body: { scheduled_at: propsValue.scheduled_at },
    });
    return response.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { cancelScheduledEmailOutputSchema } from '../output-schemas';

export const cancelScheduledEmail = createAction({
  name: 'cancel_scheduled_email',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Cancel Scheduled Email',
  outputSchema: cancelScheduledEmailOutputSchema,
  description: 'Cancel a scheduled email before it is sent',
  audience: 'both',
  aiMetadata: { description: 'Cancels a previously scheduled email so it will not be delivered, identified by its Resend email ID. Use this to stop a future send before its scheduled time. Effectively idempotent — once an email is cancelled, repeating the call has no further effect; only works while the email is still pending.', idempotent: true },
  props: {
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID of the scheduled email to cancel. Use "List Sent Emails" to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: `/emails/${propsValue.email_id}/cancel` });
  },
});

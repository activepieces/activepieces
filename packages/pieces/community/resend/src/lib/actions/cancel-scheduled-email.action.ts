import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
    info: Property.MarkDown({
      value: 'Only emails that have not been sent yet can be cancelled.',
      variant: MarkdownVariant.INFO,
    }),
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID returned by Send Email or List Sent Emails.',
      placeholder: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: `/emails/${propsValue.email_id}/cancel` });
  },
});

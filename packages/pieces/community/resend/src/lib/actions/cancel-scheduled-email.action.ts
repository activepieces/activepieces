import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const cancelScheduledEmail = createAction({
  name: 'cancel_scheduled_email',
  auth: resendAuth,
  displayName: 'Cancel Scheduled Email',
  description: 'Cancel a scheduled email before it is sent',
  props: {
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID of the scheduled email to cancel. Use "List Sent Emails" to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{ object: string; id: string }>({
      method: HttpMethod.POST,
      url: `https://api.resend.com/emails/${propsValue.email_id}/cancel`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body;
  },
});

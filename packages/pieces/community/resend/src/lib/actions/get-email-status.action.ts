import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const getEmailStatus = createAction({
  name: 'get_email_status',
  auth: resendAuth,
  displayName: 'Get Email Status',
  description: 'Retrieve the delivery status of a sent email',
  audience: 'both',
  aiMetadata: { description: 'Looks up the current delivery status and details of a single previously sent email by its Resend email ID. Use this to check whether a specific email was delivered, bounced, or is still scheduled. Read-only and idempotent; requires the email ID returned when the email was sent.', idempotent: true },
  props: {
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID returned when you sent the email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.resend.com/emails/${propsValue.email_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });
    return response.body;
  },
});

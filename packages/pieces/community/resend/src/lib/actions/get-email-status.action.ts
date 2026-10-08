import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { getEmailStatusOutputSchema } from '../output-schemas';

export const getEmailStatus = createAction({
  name: 'get_email_status',
  classification: 'READ',
  auth: resendAuth,
  displayName: 'Get Email Status',
  outputSchema: getEmailStatusOutputSchema,
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
    return await resendClient.sendRequest({ auth: auth.secret_text, method: HttpMethod.GET, path: `/emails/${propsValue.email_id}` });
  },
});

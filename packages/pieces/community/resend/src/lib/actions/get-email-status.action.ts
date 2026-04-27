import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const getEmailStatus = createAction({
  name: 'get_email_status',
  auth: resendAuth,
  displayName: 'Get Email Status',
  description: 'Retrieve the delivery status of a sent email',
  props: {
    email_id: Property.ShortText({ displayName: 'Email ID', description: 'The ID returned when you sent the email', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.resend.com/emails/${propsValue.email_id}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    return response.body;
  },
});

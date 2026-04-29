import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { customerioAuth } from '../../..';

export const sendTransactionalEmail = createAction({
  name: 'send_transactional_email',
  auth: customerioAuth,
  displayName: 'Send Transactional Email',
  description: 'Send a transactional email using a Customer.io template',
  props: {
    transactional_message_id: Property.ShortText({
      displayName: 'Transactional Message ID',
      description: 'The ID of the transactional message template in Customer.io',
      required: true,
    }),
    to: Property.ShortText({ displayName: 'To Email', required: true }),
    identifiers_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer ID to associate this email with',
      required: true,
    }),
    message_data: Property.Json({ displayName: 'Template Variables', description: 'Variables to inject into the template', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.customer.io/v1/send/email',
      headers: {
        Authorization: `Bearer ${auth.app_api_key}`,
        'Content-Type': 'application/json',
      },
      body: {
        transactional_message_id: propsValue.transactional_message_id,
        to: propsValue.to,
        identifiers: { id: propsValue.identifiers_id },
        message_data: propsValue.message_data || {},
      },
    });
    return response.body;
  },
});

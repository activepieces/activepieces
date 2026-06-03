import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quizellAuth } from '../../';
import { quizellApiCall } from '../common/client';

export const getCustomer = createAction({
  auth: quizellAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: 'Retrieves details of a specific customer by their ID.',
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer to retrieve. Use the "List Customers" action to find customer IDs.',
      required: true,
    }),
  },
  async run(context) {
    const response = await quizellApiCall<{
      status: boolean;
      message: string;
      data: Record<string, unknown>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/customers/detail/${context.propsValue.customer_id}`,
    });

    const customer = response.body.data;
    const customFields = customer['custom_fields'];

    return {
      id: customer['id'] ?? null,
      quiz_id: customer['quiz_id'] ?? null,
      email: customer['email'] ?? null,
      first_name: customer['first_name'] ?? null,
      last_name: customer['last_name'] ?? null,
      phone: customer['phone'] ?? null,
      country: customer['country'] ?? null,
      city: customer['city'] ?? null,
      address: customer['address'] ?? null,
      note: customer['note'] ?? null,
      custom_fields: customFields && typeof customFields === 'object' ? JSON.stringify(customFields) : null,
      created_at: customer['created_at'] ?? null,
      updated_at: customer['updated_at'] ?? null,
    };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quizellAuth } from '../../';
import { quizellApiCall } from '../common/client';

export const updateCustomer = createAction({
  auth: quizellAuth,
  name: 'update_customer',
  displayName: 'Update Customer',
  description: 'Updates an existing customer record in Quizell.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing Quizell customer (quiz lead), identified by customer_id. Use when correcting or enriching a known customer record; requires customer_id, quiz_id, and email. Idempotent — re-sending the same fields leaves the record in the same state.', idempotent: true },
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer to update. Use the "List Customers" or "Get Customer" actions to find this ID.',
      required: true,
    }),
    quiz_id: Property.ShortText({
      displayName: 'Quiz ID',
      description: 'The ID of the quiz associated with this customer.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: "The customer's email address.",
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "The customer's first name.",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "The customer's last name.",
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: "The customer's phone number (e.g. +1-555-123-4567).",
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: "The customer's country.",
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: "The customer's city.",
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: "The customer's street address.",
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'An internal note about this customer.',
      required: false,
    }),
  },
  async run(context) {
    const { customer_id, quiz_id, email, first_name, last_name, phone, country, city, address, note } = context.propsValue;

    const customerData: Record<string, unknown> = {
      quiz_id,
      email,
    };
    if (first_name) customerData['first_name'] = first_name;
    if (last_name) customerData['last_name'] = last_name;
    if (phone) customerData['phone'] = phone;
    if (country) customerData['country'] = country;
    if (city) customerData['city'] = city;
    if (address) customerData['address'] = address;
    if (note) customerData['note'] = note;

    const response = await quizellApiCall<{
      status: boolean;
      message: string;
      data: Record<string, unknown>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/customers/update/${customer_id}`,
      body: { customer_data: customerData },
    });

    const customer = response.body.data;
    return {
      success: response.body.status,
      message: response.body.message,
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
      updated_at: customer['updated_at'] ?? null,
    };
  },
});

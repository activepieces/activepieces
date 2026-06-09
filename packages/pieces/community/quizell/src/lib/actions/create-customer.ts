import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quizellAuth } from '../../';
import { quizellApiCall } from '../common/client';

export const createCustomer = createAction({
  auth: quizellAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer (quiz lead) in Quizell.',
  props: {
    quiz_id: Property.ShortText({
      displayName: 'Quiz ID',
      description: 'The ID of the quiz this customer responded to. Find it in your Quizell dashboard under the quiz settings URL (e.g. the number at the end of quizell.com/quiz/12345).',
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
      description: "The customer's country (e.g. United States).",
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
    const { quiz_id, email, first_name, last_name, phone, country, city, address, note } = context.propsValue;

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
      method: HttpMethod.POST,
      path: '/customers/store',
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
      created_at: customer['created_at'] ?? null,
      updated_at: customer['updated_at'] ?? null,
    };
  },
});

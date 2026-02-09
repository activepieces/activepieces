import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { voucheryIoAuth } from '../common/auth';

export const createCustomer = createAction({
  auth: voucheryIoAuth,
  name: 'createCustomer',
  displayName: 'Create Customer',
  description: 'Create a new customer',
  props: {
    identifier: Property.ShortText({
      displayName: 'Customer Identifier',
      description:
        'Unique customer identifier in your application. Can be hash, id, email or any other unique value',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Customer full name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
      required: false,
    }),
    birthdate: Property.Object({
      displayName: 'Birthdate',
      description: 'Customer birthdate object',
      required: false,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description:
        'Array of category objects to determine how customer is related to specific categories',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Category Name',
          description: 'Name of the category',
          required: true,
        }),
        tag: Property.ShortText({
          displayName: 'tag',
          description: 'tag',
          required: true,
        }),
      },
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional metadata for the customer',
      required: false,
    }),
    referrer_code: Property.ShortText({
      displayName: 'Referrer Code',
      description: 'A referral code from the recommending user',
      required: false,
    }),
    loyalty_points: Property.Number({
      displayName: 'Loyalty Points',
      description:
        '[DEPRECATED - use grant-points endpoint instead] Number of loyalty points customer will have',
      required: false,
    }),
  },
  async run(context) {
    const {
      identifier,
      name,
      email,
      birthdate,
      categories,
      metadata,
      referrer_code,
      loyalty_points,
    } = context.propsValue;

    const body: any = {
      identifier,
      categories,
      metadata,
    };

    if (name) body.name = name;
    if (email) body.email = email;
    if (birthdate) body.birthdate = birthdate;
    if (referrer_code) body.referrer_code = referrer_code;
    if (loyalty_points !== undefined) body.loyalty_points = loyalty_points;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/customers`,
      body
    );

    return response;
  },
});

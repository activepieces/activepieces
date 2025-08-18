import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCustomer = createAction({
  auth: helpScoutAuth,
  name: 'find_customer',
  displayName: 'Find Customer',
  description: 'Finds a customer by email.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      email: z.string().min(1, 'Please provide a email.'),
    });
    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: `/customers`,
      auth,
      queryParams: {
        query: `(email:"${propsValue.email}")`,
      },
    });
    const { _embedded } = response.body as {
      _embedded: {
        customers: { id: number; firstName: string; lastName: string }[];
      };
    };

    return {
      found: _embedded.customers.length > 0,
      data: _embedded.customers.length > 0 ? _embedded.customers[0] : {},
    };
  },
});

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
  description: 'Retrieve a customer by ID (as documented in Help Scout API).',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      customerId: z.string().min(1, 'Please provide a valid customer ID.'),
    });
    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: `/customers/${propsValue.customerId}`,
      auth,
    });
    return response;
  },
}); 
import { createAction, Property } from '@activepieces/pieces-framework';

import { kustomerAuth } from '../common/auth';
import { kustomerClient } from '../common/client';
import { kustomerUtils } from '../common/utils';

export const createCustomerAction = createAction({
  auth: kustomerAuth,
  name: 'create-customer',
  displayName: 'Create Customer',
  description: 'Creates a customer in Kustomer.',
  props: {
    customer: Property.Json({
      displayName: 'Customer',
      description:
        'A JSON object sent directly to `POST /customers`. Example: `{ "name": "Jane Doe" }`.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = kustomerUtils.parseAuthToken({
      value: context.auth,
    });
    const customer = kustomerUtils.parseJsonObject({
      value: context.propsValue.customer,
      fieldName: 'Customer',
    });

    return kustomerClient.createCustomer({
      apiKey,
      customer,
    });
  },
});

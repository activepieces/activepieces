import { createAction, Property } from '@activepieces/pieces-framework';

import { kustomerAuth } from '../common/auth';
import { kustomerClient } from '../common/client';
import { kustomerUtils } from '../common/utils';

export const getCustomerAction = createAction({
  auth: kustomerAuth,
  name: 'get-customer',
  displayName: 'Get Customer',
  description: 'Gets a customer by ID from Kustomer.',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The Kustomer customer ID.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey= context.auth.secret_text as string;
    const customerId = kustomerUtils.parseRequiredString({
      value: context.propsValue.customerId,
      fieldName: 'Customer ID',
    });

    return kustomerClient.getCustomer({
      apiKey,
      customerId,
    });
  },
});

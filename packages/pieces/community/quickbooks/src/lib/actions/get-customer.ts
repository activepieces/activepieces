import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../..';
import { getQBEntity, QBCustomer } from '../common';

export const quickbooksGetCustomer = createAction({
  auth: quickbooksAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: 'Retrieves a customer by their QuickBooks ID.',
  props: {
    realm_id: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description: 'Your QuickBooks Company ID.',
      required: true,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The QuickBooks ID of the customer to retrieve.',
      required: true,
    }),
    use_sandbox: Property.Checkbox({
      displayName: 'Use Sandbox',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { realm_id, customer_id, use_sandbox } = context.propsValue;

    const customer = await getQBEntity<QBCustomer>(
      context.auth as any,
      realm_id,
      'Customer',
      customer_id,
      use_sandbox ?? false
    );

    return customer;
  },
});

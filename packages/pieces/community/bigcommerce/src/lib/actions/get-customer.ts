import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';
import { getCustomerOutputSchema } from '../common/schemas';
import { parsePositiveIntId } from '../common/shared-runs';

export const getCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'getCustomer',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Gets a customer by ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves one BigCommerce customer by numeric customer_id (from Search Customer, an order, or a customer trigger) and returns the customer record. Fails with a not-found error when no customer has that id. Read-only.',
    idempotent: true,
  },
  outputSchema: getCustomerOutputSchema,
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Numeric BigCommerce customer ID',
      required: true,
    }),
  },
  async run(context) {
    const customerId = parsePositiveIntId({ value: context.propsValue.customer_id, field: 'Customer ID' });
    const response = await bigCommerceApiService.fetchCustomers({
      auth: context.auth.props,
      query: { 'id:in': customerId },
    });
    const customer = response.data[0];
    if (!customer) {
      throw new Error(`BigCommerce customer ${customerId} was not found.`);
    }
    return customer;
  },
});

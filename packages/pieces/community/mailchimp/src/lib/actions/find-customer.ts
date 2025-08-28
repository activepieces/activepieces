import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const findCustomer = createAction({
  auth: mailchimpAuth,
  name: 'find_customer',
  displayName: 'Find Customer',
  description: 'Find a customer in a connected e-commerce store',
  props: {
    store_id: mailchimpCommon.mailChimpStoreIdDropdown,
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The unique identifier for the customer',
      required: false,
    }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Search by customer email address',
      required: false,
    }),
  },
  async run(context) {
    try {
      const storeId = context.propsValue.store_id!;

      if (context.propsValue.customer_id) {
        // Get specific customer by ID
        const response = await mailchimpCommon.makeApiRequest(
          context.auth,
          `/ecommerce/stores/${storeId}/customers/${context.propsValue.customer_id}`
        );
        return response.body;
      } else {
        // Get all customers and filter if needed
        let endpoint = `/ecommerce/stores/${storeId}/customers`;
        
        const response = await mailchimpCommon.makeApiRequest(
          context.auth,
          endpoint
        );

        let customers = response.body.customers || [];

        // Filter by email if provided
        if (context.propsValue.email_address) {
          const email = context.propsValue.email_address.toLowerCase();
          customers = customers.filter((customer: any) => 
            customer.email_address?.toLowerCase() === email
          );
        }

        return {
          customers,
          total_items: customers.length,
        };
      }
    } catch (error) {
      throw new Error(`Failed to find customer: ${JSON.stringify(error)}`);
    }
  },
});

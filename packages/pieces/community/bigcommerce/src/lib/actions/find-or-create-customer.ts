import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const getCustomerFields = (): DynamicPropsValue => {
  return {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Customer first name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Customer last name',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Customer company name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Customer phone number',
      required: false,
    }),
    customer_group_id: Property.Number({
      displayName: 'Customer Group ID',
      description: 'Customer group ID',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Customer notes',
      required: false,
    }),
  };
};

export const findOrCreateCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'find_or_create_customer',
  displayName: 'Find or Create Customer',
  description: 'Finds an existing customer by email or creates a new one if not found',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address to search for',
      required: true,
    }),
    customerFields: Property.DynamicProperties({
      displayName: 'Customer Fields (for creation)',
      description: 'Customer information to use if creating a new customer',
      required: true,
      refreshers: [],
      props: async () => {
        return getCustomerFields();
      },
    }),
  },
  async run(context) {
    const { email, customerFields } = context.propsValue;

    if (!email || !customerFields || typeof customerFields !== 'object') {
      throw new Error('Email and customer fields are required');
    }

    const { first_name, last_name } = customerFields as any;

    if (!first_name || !last_name) {
      throw new Error('First name and last name are required for customer creation');
    }

    try {
      const searchResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/customers',
        method: HttpMethod.GET,
        queryParams: { 'email:like': email, limit: '1' },
      });

      const existingCustomers = (searchResponse.body as { data: any[] }).data || [];

      if (existingCustomers.length > 0) {
        return {
          success: true,
          found: true,
          message: `Customer with email ${email} found`,
          data: existingCustomers[0],
        };
      }

      const customerData: any = { email };
      
      Object.entries(customerFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          customerData[key] = value;
        }
      });

      const createResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/customers',
        method: HttpMethod.POST,
        body: customerData,
      });

      const customer = (createResponse.body as { data: any }).data;

      return {
        success: true,
        found: false,
        message: `Customer ${first_name} ${last_name} created successfully`,
        data: customer,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to find or create customer');
    }
  },
});
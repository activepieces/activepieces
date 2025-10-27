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
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
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
    tax_exempt_category: Property.ShortText({
      displayName: 'Tax Exempt Category',
      description: 'Tax exempt category',
      required: false,
    }),
    accepts_product_review_abandoned_cart_emails: Property.Checkbox({
      displayName: 'Accepts Marketing Emails',
      description: 'Whether customer accepts product review and abandoned cart emails',
      required: false,
      defaultValue: true,
    }),
  };
};

export const createCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer in BigCommerce',
  props: {
    customerFields: Property.DynamicProperties({
      displayName: 'Customer Fields',
      description: 'Customer information',
      required: true,
      refreshers: [],
      props: async () => {
        return getCustomerFields();
      },
    }),
  },
  async run(context) {
    const { customerFields } = context.propsValue;

    if (!customerFields || typeof customerFields !== 'object') {
      throw new Error('Customer fields are required');
    }

    const { first_name, last_name, email } = customerFields as any;

    if (!first_name || !last_name || !email) {
      throw new Error('First name, last name, and email are required');
    }

    try {
      const customerData: any = {};
      
      Object.entries(customerFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          customerData[key] = value;
        }
      });

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/customers',
        method: HttpMethod.POST,
        body: customerData,
      });

      const customer = (response.body as { data: any }).data;

      return {
        success: true,
        message: `Customer ${first_name} ${last_name} created successfully`,
        data: customer,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to create customer');
    }
  },
});
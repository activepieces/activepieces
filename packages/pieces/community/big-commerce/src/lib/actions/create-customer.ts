import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { sendBigCommerceRequest, BigCommerceAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCustomer = createAction({
  auth: bigCommerceAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Create a new customer in BigCommerce',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the customer',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the customer',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the customer',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company name of the customer',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the customer',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Internal notes about the customer',
      required: false,
    }),
    tax_exempt_category: Property.ShortText({
      displayName: 'Tax Exempt Category',
      description: 'The tax exempt category for the customer',
      required: false,
    }),
    customer_group_id: Property.Number({
      displayName: 'Customer Group ID',
      description: 'The ID of the customer group to assign the customer to',
      required: false,
    }),
    new_password: Property.ShortText({
      displayName: 'Password',
      description: 'Set a password for the customer account',
      required: false,
    }),
    force_password_reset: Property.Checkbox({
      displayName: 'Force Password Reset',
      description: 'Force the customer to reset their password on first login',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      email,
      first_name,
      last_name,
      company,
      phone,
      notes,
      tax_exempt_category,
      customer_group_id,
      new_password,
      force_password_reset,
    } = context.propsValue;

    // Build customer object
    const customerData: Record<string, any> = {
      email,
      first_name,
      last_name,
    };

    // Add optional fields
    if (company) customerData.company = company;
    if (phone) customerData.phone = phone;
    if (notes) customerData.notes = notes;
    if (tax_exempt_category) customerData.tax_exempt_category = tax_exempt_category;
    if (customer_group_id) customerData.customer_group_id = customer_group_id;

    // Add authentication fields if password is provided
    if (new_password || force_password_reset) {
      customerData.authentication = {};
      if (new_password) {
        customerData.authentication.new_password = new_password;
      }
      if (force_password_reset) {
        customerData.authentication.force_password_reset = force_password_reset;
      }
    }

    // Send request to create customer (API expects an array)
    const response = await sendBigCommerceRequest<{
      data: Array<{
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        company: string;
        phone: string;
        notes: string;
        tax_exempt_category: string;
        customer_group_id: number;
        date_created: string;
        date_modified: string;
      }>;
      meta: Record<string, any>;
    }>({
      auth: context.auth as BigCommerceAuth,
      method: HttpMethod.POST,
      url: '/customers',
      body: [customerData],
    });

    return response.body;
  },
});

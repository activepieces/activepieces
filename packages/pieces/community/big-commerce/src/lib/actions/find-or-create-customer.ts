import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { sendBigCommerceRequest, BigCommerceAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrCreateCustomer = createAction({
  auth: bigCommerceAuth,
  name: 'find_or_create_customer',
  displayName: 'Find or Create Customer',
  description: 'Find an existing customer by email or create a new one if not found',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to search for or use when creating',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name (used when creating new customer)',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name (used when creating new customer)',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company name (used when creating new customer)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number (used when creating new customer)',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Internal notes (used when creating new customer)',
      required: false,
    }),
    customer_group_id: Property.Number({
      displayName: 'Customer Group ID',
      description: 'The customer group ID (used when creating new customer)',
      required: false,
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
      customer_group_id,
    } = context.propsValue;

    // Step 1: Search for existing customer by email
    const searchResponse = await sendBigCommerceRequest<{
      data: Array<{
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        company: string;
        phone: string;
        notes: string;
        customer_group_id: number;
        date_created: string;
        date_modified: string;
        address_count: number;
        attribute_count: number;
      }>;
      meta: {
        pagination: {
          total: number;
        };
      };
    }>({
      auth: context.auth as BigCommerceAuth,
      method: HttpMethod.GET,
      url: '/customers',
      queryParams: {
        'email:in': email,
        limit: '1',
      },
    });

    // If customer exists, return it
    if (searchResponse.body.data && searchResponse.body.data.length > 0) {
      const existingCustomer = searchResponse.body.data[0];
      return {
        found: true,
        created: false,
        customer: existingCustomer,
        message: `Found existing customer with ID: ${existingCustomer.id}`,
      };
    }

    // Step 2: Customer not found, create a new one
    const customerData: Record<string, any> = {
      email,
      first_name,
      last_name,
    };

    // Add optional fields
    if (company) customerData['company'] = company;
    if (phone) customerData['phone'] = phone;
    if (notes) customerData['notes'] = notes;
    if (customer_group_id) customerData['customer_group_id'] = customer_group_id;

    const createResponse = await sendBigCommerceRequest<{
      data: Array<{
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        company: string;
        phone: string;
        notes: string;
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

    const newCustomer = createResponse.body.data[0];
    return {
      found: false,
      created: true,
      customer: newCustomer,
      message: `Created new customer with ID: ${newCustomer.id}`,
    };
  },
});

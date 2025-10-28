import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const getCustomerFields = (): DynamicPropsValue => {
  return {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Customer first name (required, max 255 characters)',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Customer last name (required, max 255 characters)',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Customer company name (max 255 characters)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Customer phone number (max 50 characters)',
      required: false,
    }),
    customer_group_id: Property.Dropdown({
      displayName: 'Customer Group',
      description: 'Customer group (optional)',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const response = await sendBigCommerceRequest({
            auth: auth as any,
            url: '/customer_groups',
            method: HttpMethod.GET,
            queryParams: { limit: '250' },
          });
          const groups = (response.body as { data: any[] }).data || [];
          if (groups.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No customer groups found',
            };
          }
          return {
            disabled: false,
            options: groups.map((group: any) => ({
              label: group.name,
              value: group.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error fetching customer groups',
          };
        }
      },
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Customer notes (max 65535 characters)',
      required: false,
    }),
    tax_exempt_category: Property.ShortText({
      displayName: 'Tax Exempt Category',
      description: 'Tax exempt category (max 255 characters)',
      required: false,
    }),
    accepts_product_review_abandoned_cart_emails: Property.Checkbox({
      displayName: 'Accepts Marketing Emails',
      description: 'Whether customer accepts product review and abandoned cart emails',
      required: false,
      defaultValue: true,
    }),
    store_credit_amounts: Property.Number({
      displayName: 'Store Credit Amount',
      description: 'Store credit amount to assign to customer',
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

    // Validate required fields for customer creation
    if (!first_name || typeof first_name !== 'string' || first_name.trim().length === 0) {
      throw new Error('First name is required for customer creation and cannot be empty');
    }

    if (first_name.length > 255) {
      throw new Error('First name cannot exceed 255 characters');
    }

    if (!last_name || typeof last_name !== 'string' || last_name.trim().length === 0) {
      throw new Error('Last name is required for customer creation and cannot be empty');
    }

    if (last_name.length > 255) {
      throw new Error('Last name cannot exceed 255 characters');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please provide a valid email address');
    }

    try {
      // Search for existing customer by exact email match
      const searchResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/customers',
        method: HttpMethod.GET,
        queryParams: { 'email': email.trim().toLowerCase(), limit: '1' },
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

      const customerData: any = {
        email: email.trim().toLowerCase(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
      };
      
      // Add optional fields if provided
      const optionalFields = [
        'company', 'phone', 'customer_group_id', 'notes', 'tax_exempt_category',
        'accepts_product_review_abandoned_cart_emails', 'store_credit_amounts'
      ];

      optionalFields.forEach(field => {
        const value = (customerFields as any)[field];
        if (value !== undefined && value !== null && value !== '') {
          customerData[field] = value;
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
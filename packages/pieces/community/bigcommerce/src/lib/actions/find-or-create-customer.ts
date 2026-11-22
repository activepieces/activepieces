import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';
import { findOrCreateCustomerOutputSchema } from '../common/schemas';

export const findOrCreateCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'findOrCreateCustomer',
  classification: 'WRITE',
  displayName: 'Find or Create Customer',
  description: 'Finds a customer by email, or creates one if none exists',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a BigCommerce customer by email only and returns { found: true, data: [customer] } if one exists; otherwise creates a new customer from the supplied details and returns { found: false, data: [customer] }. The phone and other fields are used only when creating and never update an existing customer. Use this instead of Create Customer when the customer may already exist. Idempotent: BigCommerce emails are unique, so repeat calls return the same customer.',
    idempotent: true,
  },
  outputSchema: findOrCreateCustomerOutputSchema,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address. Used to find an existing customer.',
      required: true,
    }),
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
      description: 'Customer phone number. Only used when a new customer is created.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Customer notes',
      required: false,
    }),
  },
  async run(context) {
    const email = context.propsValue.email.trim();
    const response = await bigCommerceApiService.fetchCustomers({
      auth: context.auth.props,
      query: { 'email:in': email },
    });

    if (response.data.length > 0) {
      return { found: true, data: response.data };
    }

    const newCustomer = await bigCommerceApiService.createCustomer({
      auth: context.auth.props,
      payload: [
        {
          email,
          first_name: context.propsValue.first_name,
          last_name: context.propsValue.last_name,
          company: context.propsValue.company,
          phone: context.propsValue.phone,
          notes: context.propsValue.notes,
        },
      ],
    });

    return { found: false, data: newCustomer.data };
  },
});

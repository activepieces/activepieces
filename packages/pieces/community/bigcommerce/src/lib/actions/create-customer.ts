import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const createCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'createCustomer',
  displayName: 'Create Customer',
  description: 'Creates a customer',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new customer record in a BigCommerce store from an email plus first/last name (company, phone, and notes optional). Use to register a shopper or contact. Not idempotent: each call adds a new customer, and BigCommerce rejects a duplicate email rather than returning the existing one, so call Search Customer or Find or Create Customer first if the customer may already exist.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
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
      description: 'Customer phone number',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Customer notes',
      required: false,
    }),
  },
  async run(context) {
    return await bigCommerceApiService.createCustomer({
      auth: context.auth.props,
      payload: [
        {
          email: context.propsValue.email,
          first_name: context.propsValue.first_name,
          last_name: context.propsValue.last_name,
          company: context.propsValue.company,
          phone: context.propsValue.phone,
          notes: context.propsValue.notes,
        },
      ],
    });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { customerDropdown } from '../common/props';
import { createdAddressListOutputSchema } from '../common/schemas';
import { parsePositiveIntId, runCreateCustomerAddress } from '../common/shared-runs';

export const createCustomerAddress = createAction({
  auth: bigcommerceAuth,
  name: 'createCustomerAddress',
  classification: 'WRITE',
  displayName: 'Create Customer Address',
  description: "Creates a customer's address",
  audience: 'human',
  aiMetadata: {
    description:
      'Adds a new address to an existing BigCommerce customer selected from a dropdown. Agents should use Create Customer Address (AI). Not idempotent: each call appends a new address even if an identical one exists.',
    idempotent: false,
  },
  outputSchema: createdAddressListOutputSchema,
  props: {
    customer_id: customerDropdown({
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the person at this address',
      placeholder: 'Jane',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the person at this address',
      placeholder: 'Doe',
      required: true,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Street address',
      placeholder: '123 Main Street',
      required: true,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City or town',
      placeholder: 'Austin',
      required: true,
    }),
    state_or_province: Property.ShortText({
      displayName: 'State/Province',
      description: 'Full state or province name',
      placeholder: 'Texas',
      required: true,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'ZIP or postal code',
      placeholder: '78701',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter ISO 3166-1 alpha-2 country code',
      placeholder: 'US',
      required: true,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Apartment, suite or unit (optional)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number for this address (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { customer_id, ...address } = context.propsValue;
    return await runCreateCustomerAddress({
      auth: context.auth.props,
      customerId: parsePositiveIntId({ value: customer_id, field: 'Customer' }),
      address,
    });
  },
});

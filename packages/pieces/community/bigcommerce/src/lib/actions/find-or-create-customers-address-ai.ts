import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { addressInputProps } from '../common/props';
import { findOrCreateAddressOutputSchema } from '../common/schemas';
import { parsePositiveIntId, runFindOrCreateCustomerAddress } from '../common/shared-runs';

export const findOrCreateCustomersAddressAi = createAction({
  auth: bigcommerceAuth,
  name: 'findOrCreateCustomersAddressAi',
  classification: 'WRITE',
  displayName: 'Find or Create Customer Address (AI)',
  description: 'Finds or creates a customer address from a customer ID. Built for AI agents.',
  audience: 'ai',
  aiMetadata: {
    description:
      'For a numeric customer_id (find it with Search Customer), scans all of that customer’s addresses and returns { found: true, data: address } when one matches address1, city and postal_code (case-insensitive). Otherwise creates the address from the supplied details and returns { found: false, data: [address] }. Requires first_name, last_name, address1, city, state_or_province, postal_code and ISO 3166-1 alpha-2 country_code. Idempotent: repeated calls reuse the matching address.',
    idempotent: true,
  },
  outputSchema: findOrCreateAddressOutputSchema,
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Numeric BigCommerce customer ID',
      required: true,
    }),
    ...addressInputProps,
  },
  async run(context) {
    const { customer_id, ...address } = context.propsValue;
    return await runFindOrCreateCustomerAddress({
      auth: context.auth.props,
      customerId: parsePositiveIntId({ value: customer_id, field: 'customer_id' }),
      address,
    });
  },
});

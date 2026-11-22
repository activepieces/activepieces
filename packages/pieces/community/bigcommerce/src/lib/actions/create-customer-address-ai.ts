import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { addressInputProps } from '../common/props';
import { createdAddressListOutputSchema } from '../common/schemas';
import { parsePositiveIntId, runCreateCustomerAddress } from '../common/shared-runs';

export const createCustomerAddressAi = createAction({
  auth: bigcommerceAuth,
  name: 'createCustomerAddressAi',
  classification: 'WRITE',
  displayName: 'Create Customer Address (AI)',
  description: "Creates a customer's address from a customer ID. Built for AI agents.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a new address to an existing BigCommerce customer. customer_id is the numeric customer id (find it with Search Customer). Requires first_name, last_name, address1, city, state_or_province, postal_code and an ISO 3166-1 alpha-2 country_code; address2 and phone are optional. Returns { data: [address] }. Not idempotent: each call appends a new address even if an identical one exists, so use Find or Create Customer Address (AI) to avoid duplicates.',
    idempotent: false,
  },
  outputSchema: createdAddressListOutputSchema,
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
    return await runCreateCustomerAddress({
      auth: context.auth.props,
      customerId: parsePositiveIntId({ value: customer_id, field: 'customer_id' }),
      address,
    });
  },
});

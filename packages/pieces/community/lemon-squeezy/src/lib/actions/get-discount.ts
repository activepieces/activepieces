import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { getRecord, seg } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const getDiscount = createAction({
  auth: lemonSqueezyAuth,
  name: 'get_discount',
  displayName: 'Get Discount',
  description: 'Retrieve a discount by ID.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Lemon Squeezy discount by numeric discount ID: code, amount and type, redemption limit, start/expiry dates and status. Use before sharing a code with a customer to confirm it is published and not expired; use List Discounts to find the ID from a code. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: recordSchema(flatFields.discount),
  props: {
    discountId: Property.ShortText({
      displayName: 'Discount ID',
      description: 'The numeric ID of the discount (not the code).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return getRecord({ apiKey: auth.secret_text, path: `/discounts/${seg({ value: propsValue.discountId, label: 'Discount ID' })}` });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { getClient } from '../common';

export const stripeDeactivatePaymentLinkAi = createAction({
  name: 'deactivate_payment_link_ai',
  auth: stripeAuth,
  displayName: 'Deactivate Payment Link (Agent)',
  description: 'Deactivate a payment link so it can no longer be used.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deactivates an existing Stripe payment link by its ID so it can no longer accept payments (sets active=false). Use to retire a shared checkout URL; use Get/List Payment Links to find the ID. Idempotent: re-running on an already-inactive link leaves it inactive.',
    idempotent: true,
  },
  props: {
    payment_link_id: Property.ShortText({
      displayName: 'Payment Link ID',
      description:
        'The payment link ID (e.g., plink_...). Obtain it from List Payment Links.',
      required: true,
    }),
  },
  async run(context) {
    const { payment_link_id } = context.propsValue;
    const client = getClient(context.auth.secret_text);
    return await client.paymentLinks.update(payment_link_id, {
      active: false,
    });
  },
});

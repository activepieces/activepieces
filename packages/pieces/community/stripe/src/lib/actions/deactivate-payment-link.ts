import { createAction } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { stripeCommon, getClient } from '../common';

export const stripeDeactivatePaymentLink = createAction({
  name: 'deactivate_payment_link',
  auth: stripeAuth,
  displayName: 'Deactivate Payment Link',
  description:
    'Disable or deactivate a Payment Link so it can no longer be used.',
  props: {
    payment_link_id: stripeCommon.paymentLink,
  },
  async run(context) {
    const { payment_link_id } = context.propsValue;
    const client = getClient(context.auth);
    return await client.paymentLinks.update(payment_link_id, {
      active: false,
    });
  },
});

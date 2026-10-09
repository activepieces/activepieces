import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ikhokhaAuth } from '../auth';
import { ikhokhaRequest } from '../common/client';

export const getPaymentAction = createAction({
  auth: ikhokhaAuth,
  name: 'get_payment',
  displayName: 'Get Payment',
  description: 'Fetch a payment by its iKhokha payment ID or your reference.',
  props: {
    payment_id: Property.ShortText({
      displayName: 'Payment ID or Reference',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return ikhokhaRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.GET,
      path: `/public/v1/payments/${encodeURIComponent(String(propsValue.payment_id))}`,
    });
  },
});

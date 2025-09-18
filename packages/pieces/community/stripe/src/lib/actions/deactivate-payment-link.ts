import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { paymentLinkIdDropdown } from '../common';

export const deactivatePaymentLink = createAction({
  auth: stripeAuth,
  name: 'deactivatePaymentLink',
  displayName: 'Deactivate Payment Link',
  description: 'Disable/deactivate a Payment Link so it can no longer be used.',
  props: {
    paymentLinkId: paymentLinkIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { paymentLinkId } = propsValue;

    const body = {
      active: false,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.stripe.com/v1/payment_links/${paymentLinkId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

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

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_links/${payment_link_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      body: {
        active: false, 
      },
    });

    return response.body;
  },
});

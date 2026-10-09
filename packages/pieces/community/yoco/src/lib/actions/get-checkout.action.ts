import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { yocoAuth } from '../auth';
import { yocoRequest } from '../common/client';

export const getCheckoutAction = createAction({
  auth: yocoAuth,
  name: 'get_checkout',
  displayName: 'Get Checkout',
  description: 'Fetch a Yoco checkout by its ID.',
  props: {
    checkout_id: Property.ShortText({
      displayName: 'Checkout ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return yocoRequest<Record<string, unknown>>({
      secretKey: auth.props.secret_key,
      method: HttpMethod.GET,
      path: `/checkouts/${encodeURIComponent(String(propsValue.checkout_id))}`,
    });
  },
});

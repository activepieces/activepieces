import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uberDirectAuth } from '../auth';
import { uberDirectRequest } from '../common/client';

export const cancelDeliveryAction = createAction({
  auth: uberDirectAuth,
  name: 'cancel_delivery',
  displayName: 'Cancel Delivery',
  description: 'Cancel an Uber Direct delivery that has not yet been picked up.',
  props: {
    delivery_id: Property.ShortText({ displayName: 'Delivery ID', required: true }),
  },
  async run({ auth, propsValue }) {
    return uberDirectRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.POST,
      path: `/deliveries/${encodeURIComponent(String(propsValue.delivery_id))}/cancel`,
      body: {},
    });
  },
});

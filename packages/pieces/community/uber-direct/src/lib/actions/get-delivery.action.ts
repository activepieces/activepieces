import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uberDirectAuth } from '../auth';
import { uberDirectRequest } from '../common/client';

export const getDeliveryAction = createAction({
  auth: uberDirectAuth,
  name: 'get_delivery',
  displayName: 'Get Delivery',
  description: 'Fetch an Uber Direct delivery by its ID.',
  props: {
    delivery_id: Property.ShortText({
      displayName: 'Delivery ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return uberDirectRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.GET,
      path: `/deliveries/${encodeURIComponent(String(propsValue.delivery_id))}`,
    });
  },
});

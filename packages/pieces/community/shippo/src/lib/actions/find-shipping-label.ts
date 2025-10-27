import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shippoAuth } from '../../';
import { shippoCommon } from '../common/client';

export const findShippingLabel = createAction({
  auth: shippoAuth,
  name: 'find_shipping_label',
  displayName: 'Find a Shipping Label',
  description: 'Searches for a shipping label by its transaction ID',
  props: {
    transactionId: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'The unique identifier for the shipping label transaction',
      required: true,
    }),
  },
  async run(context) {
    const response = await shippoCommon.makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/transactions/${context.propsValue.transactionId}`
    );

    return response.body;
  },
});


import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const cancelOrder = createAction({
  auth: lightfunnelsAuth,
  name: 'cancel_order',
  displayName: 'Cancel Order',
  description: 'Cancel an order',
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID of the order to cancel',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Reason for cancellation',
      required: true,
    }),
    notifyCustomer: Property.Checkbox({
      displayName: 'Notify Customer',
      description: 'Whether to notify the customer',
      required: false,
      defaultValue: true,
    }),
    refund: Property.Checkbox({
      displayName: 'Refund',
      description: 'Whether to refund the order',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { orderId, reason, notifyCustomer, refund } = context.propsValue;

    const graphqlQuery = `
      mutation cancelOrderMutation($id: ID!, $reason: String!, $notifyCustomer: Boolean!, $refund: Boolean!) {
        cancelOrder(id: $id, reason: $reason, notifyCustomer: $notifyCustomer, refund: $refund) {
          id
          _id
          name
          cancelled_at
          financial_status
          fulfillment_status
        }
      }
    `;

    const variables = {
      id: orderId,
      reason,
      notifyCustomer: notifyCustomer ?? true,
      refund: refund ?? false,
    };

    const response = await lightfunnelsCommon.makeGraphQLRequest(
      context.auth,
      graphqlQuery,
      variables
    );

    return response.data.cancelOrder;
  },
});

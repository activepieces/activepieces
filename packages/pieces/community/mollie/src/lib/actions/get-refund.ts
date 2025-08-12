import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MollieRefund } from '../common';

export const mollieGetRefund = createAction({
  auth: mollieAuth,
  name: 'get_refund',
  displayName: 'Get Refund',
  description: 'Retrieve a specific refund by payment ID and refund ID',
  props: {
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the payment the refund belongs to',
      required: true,
    }),
    refundId: Property.ShortText({
      displayName: 'Refund ID',
      description: 'The ID of the refund to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const refund = await mollieCommon.getResource<MollieRefund>(
      context.auth,
      `payments/${context.propsValue.paymentId}/refunds`,
      context.propsValue.refundId
    );

    return refund;
  },
});
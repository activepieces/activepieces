import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MolliePayment } from '../common';

export const mollieCancelPayment = createAction({
  auth: mollieAuth,
  name: 'cancel_payment',
  displayName: 'Cancel Payment',
  description: 'Cancel a payment (only possible for certain payment methods and statuses)',
  props: {
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the payment to cancel',
      required: true,
    }),
  },
  async run(context) {
    const payment = await mollieCommon.deleteResource<MolliePayment>(
      context.auth,
      'payments',
      context.propsValue.paymentId
    );

    return payment;
  },
});
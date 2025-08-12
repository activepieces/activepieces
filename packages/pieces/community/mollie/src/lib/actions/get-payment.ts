import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MolliePayment } from '../common';

export const mollieGetPayment = createAction({
  auth: mollieAuth,
  name: 'get_payment',
  displayName: 'Get Payment',
  description: 'Retrieve a specific payment by ID',
  props: {
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the payment to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const payment = await mollieCommon.getResource<MolliePayment>(
      context.auth,
      'payments',
      context.propsValue.paymentId
    );

    return payment;
  },
});
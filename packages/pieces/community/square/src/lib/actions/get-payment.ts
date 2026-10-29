import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareInputs } from '../common/inputs';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const getPaymentAction = createAction({
  name: 'get_payment',
  classification: 'READ',
  auth: squareAuth,
  displayName: 'Get Payment',
  description: 'Gets a payment with its amount, status and card summary.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads one Square payment by payment ID (from the New Payment trigger, List Payments or an order): status, amounts as decimal strings, refunded amount, card brand and last 4 digits, linked order and customer. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    payment_id: Property.ShortText({ displayName: 'Payment ID', description: 'Map it from the New Payment trigger or List Payments.', required: true }),
  },
  outputSchema: squareOutputSchemas.payment,
  async run(context) {
    const paymentId = squareInputs.requireId({ value: context.propsValue.payment_id, label: 'Payment ID' });
    const body = await squareClient.request<unknown>({ auth: context.auth, method: HttpMethod.GET, path: ['v2', 'payments', paymentId], operation: `read payment "${paymentId}"` });
    return squareShape.payment(squareShape.requireObject({ body, key: 'payment', what: 'payment' }));
  },
});

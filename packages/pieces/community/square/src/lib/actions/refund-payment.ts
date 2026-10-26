import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient, SquareApiError } from '../common/client';
import { squareIdempotency } from '../common/idempotency';
import { squareInputs } from '../common/inputs';
import { squareMoney } from '../common/money';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const refundPaymentAction = createAction({
  name: 'refund_payment',
  classification: 'DESTRUCTIVE',
  auth: squareAuth,
  displayName: 'Refund Payment',
  description:
    'Refunds all or part of a payment. Card refunds send real money back to the buyer and cannot be undone. Needs a connection created or reconnected with piece version 1.0.0 or later.',
  audience: 'human',
  aiMetadata: {
    description:
      'Refunds an amount of a completed Square payment back to the buyer; cannot be undone. Not offered to agents. A retried step returns the same refund instead of repeating the write, and identical calls within one run (for example a loop with the same input) count as one; set Idempotency Key (for example to the loop item) to keep them separate. A new run writes again.',
    idempotent: false,
  },
  props: {
    payment_id: Property.ShortText({ displayName: 'Payment ID', description: 'Map it from the New Payment trigger, Get Payment or List Payments.', required: true }),
    amount: Property.ShortText({ displayName: 'Amount to Refund', description: 'Decimal amount in the payment currency, for example 12.50. Must not exceed what is left to refund.', required: true }),
    reason: Property.ShortText({ displayName: 'Reason', description: 'Shown to the buyer on the refund receipt.', required: false }),
    idempotency_key: squareProps.idempotencyKey(),
  },
  outputSchema: squareOutputSchemas.refund,
  async run(context) {
    const p = context.propsValue;
    const paymentId = squareInputs.requireId({ value: p.payment_id, label: 'Payment ID' });
    const current = await squareClient.request<unknown>({ auth: context.auth, method: HttpMethod.GET, path: ['v2', 'payments', paymentId], operation: `read payment "${paymentId}"` });
    const payment = squareShape.payment(squareShape.requireObject({ body: current, key: 'payment', what: 'payment' }));
    if (!payment.currency || payment.total_minor === null) {
      throw new Error(`Payment "${paymentId}" has no amount to refund.`);
    }
    const minor = squareMoney.toMinor({ amount: p.amount, currency: payment.currency, label: 'Amount to Refund' });
    const payload = squareOps.dropUndefined({
      payment_id: paymentId,
      amount_money: { amount: minor, currency: payment.currency },
      reason: squareInputs.text(p.reason),
    });
    const body = await squareIdempotency
      .execute({
        context,
        action: 'refund_payment',
        input: payload,
        send: ({ idempotencyKey }) =>
          squareClient.request<unknown>({
            auth: context.auth,
            method: HttpMethod.POST,
            path: ['v2', 'refunds'],
            body: { ...payload, idempotency_key: idempotencyKey },
            operation: 'refund the payment',
          }),
      })
      .catch((error: unknown) => {
        if (error instanceof SquareApiError && error.code === 'REFUND_AMOUNT_INVALID') {
          const remaining = Math.max(0, (payment.total_minor ?? 0) - (payment.refunded_minor ?? 0));
          throw new Error(
            `Amount to Refund ${p.amount} is more than the ${squareMoney.format({ minor: remaining, currency: payment.currency ?? '' })} ${payment.currency ?? ''} left to refund on this payment.`,
          );
        }
        throw error;
      });
    return squareShape.refund(squareShape.requireObject({ body, key: 'refund', what: 'refund' }));
  },
});

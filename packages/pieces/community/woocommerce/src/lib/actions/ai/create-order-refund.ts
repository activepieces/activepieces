import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooValues } from '../../common/props';
import { orderRefundOutputSchema } from '../../output-schemas';

export const wooAiCreateOrderRefund = createAction({
  name: 'create_order_refund',
  classification: 'DESTRUCTIVE',
  displayName: 'Create Order Refund',
  description: 'Refund an amount on an order. By default the refund is only recorded in WooCommerce.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records an irreversible refund of an amount on one order and emails the customer about it; by default no money moves, but the order total drops and a full refund marks the order refunded. With Refund Via Gateway on, real money is sent back through the payment gateway, which fails on gateways without refund support (bank transfer, cheque, cash on delivery). Check list_order_refunds first, because each call adds another refund.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: orderRefundOutputSchema,
  props: {
    order_id: Property.Number({
      displayName: 'Order ID',
      description: 'Id of the order to refund.',
      required: true,
    }),
    amount: Property.ShortText({
      displayName: 'Amount',
      description: 'Amount to refund as a decimal string, e.g. 10.00. Cannot exceed what is left to refund on the order.',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Reason for the refund, stored with the refund.',
      required: false,
    }),
    refund_via_gateway: Property.Checkbox({
      displayName: 'Refund Via Gateway',
      description: 'When on, the money is actually sent back to the customer through the payment gateway. When off (the default) the refund is only recorded in WooCommerce.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { order_id, amount, reason, refund_via_gateway } = context.propsValue;
    const trimmedAmount = amount.trim();
    const numericAmount = Number(trimmedAmount);
    if (trimmedAmount.length === 0 || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error(`Amount must be a positive decimal number such as 10.00; got "${amount}".`);
    }
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/orders/${wooClient.encodeId(order_id)}/refunds`,
      body: wooValues.pruneUndefined({
        amount: trimmedAmount,
        reason: wooValues.nonEmpty(reason),
        api_refund: refund_via_gateway === true,
      }),
    });
  },
});

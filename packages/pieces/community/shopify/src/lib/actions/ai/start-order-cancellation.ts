import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { startOrderCancellationOutputSchema } from '../../output-schemas/orders';

export const shopifyAiStartOrderCancellation = createAction({
  auth: shopifyAuth,
  name: 'start_order_cancellation',
  classification: 'DESTRUCTIVE',
  displayName: 'Start Order Cancellation',
  description: 'Cancel an order asynchronously and get a job to poll.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts the irreversible, asynchronous cancellation of one order and returns only a job id; poll get_job until done is true, then read the order with get_order. A reason is required. Stock is restocked only if restock is on, and money is refunded only if a refund method is chosen; authorized (uncaptured) payments are voided either way. The customer is notified only if notify_customer is on. Not safe to repeat.',
    idempotent: false,
  },
  outputSchema: startOrderCancellationOutputSchema,
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
    reason: Property.StaticDropdown({
      displayName: 'Reason',
      description: 'Why the order is cancelled.',
      required: true,
      options: {
        options: [
          { label: 'Customer changed or cancelled the order', value: 'CUSTOMER' },
          { label: 'Payment declined', value: 'DECLINED' },
          { label: 'Fraudulent order', value: 'FRAUD' },
          { label: 'Items unavailable', value: 'INVENTORY' },
          { label: 'Staff error', value: 'STAFF' },
          { label: 'Other', value: 'OTHER' },
        ],
      },
    }),
    restock: Property.Checkbox({
      displayName: 'Restock Items',
      description: 'Return the line items to inventory. Off by default.',
      required: false,
      defaultValue: false,
    }),
    refund_method: Property.StaticDropdown({
      displayName: 'Refund Method',
      description:
        'How to refund captured payments. Leave empty to cancel without refunding captured money (authorized payments are still voided).',
      required: false,
      options: {
        options: [
          { label: 'Refund to the original payment methods', value: 'ORIGINAL_PAYMENT_METHODS' },
          { label: 'Refund as store credit', value: 'STORE_CREDIT' },
        ],
      },
    }),
    store_credit_expires_at: Property.DateTime({
      displayName: 'Store Credit Expiry',
      description: 'Only for a store credit refund: when the credit expires (ISO 8601). Leave empty for no expiry.',
      required: false,
    }),
    notify_customer: Property.Checkbox({
      displayName: 'Notify Customer',
      description: 'Email the customer about the cancellation. Off by default.',
      required: false,
      defaultValue: false,
    }),
    staff_note: Property.ShortText({
      displayName: 'Staff Note',
      description: 'Internal note about the cancellation, not shown to the customer.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const orderId = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const refundMethod = buildRefundMethod({
      method: propsValue.refund_method,
      expiresAt: shopifyValues.nonEmpty(propsValue.store_credit_expires_at),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      orderCancel: { job: { id: string; done?: boolean | null } | null } | null;
    }>({
      auth,
      query: `mutation StartOrderCancellation($orderId: ID!, $reason: OrderCancelReason!, $restock: Boolean!, $notifyCustomer: Boolean, $refundMethod: OrderCancelRefundMethodInput, $staffNote: String) { orderCancel(orderId: $orderId, reason: $reason, restock: $restock, notifyCustomer: $notifyCustomer, refundMethod: $refundMethod, staffNote: $staffNote) { job { id done } orderCancelUserErrors { field message code } } }`,
      variables: shopifyValues.compact({
        orderId,
        reason: propsValue.reason,
        restock: propsValue.restock ?? false,
        notifyCustomer: propsValue.notify_customer ?? false,
        refundMethod,
        staffNote: shopifyValues.nonEmpty(propsValue.staff_note),
      }),
    });
    const job = data.orderCancel?.job;
    if (!job) {
      throw new Error('Shopify did not return a cancellation job.');
    }
    return {
      order_id: orderId,
      job_id: job.id,
      job_done: job.done ?? false,
      redacted_fields: redactedFields,
    };
  },
});

function buildRefundMethod({
  method,
  expiresAt,
}: {
  method: string | undefined;
  expiresAt: string | undefined;
}): Record<string, unknown> | undefined {
  if (method === 'ORIGINAL_PAYMENT_METHODS') {
    return { originalPaymentMethodsRefund: true };
  }
  if (method === 'STORE_CREDIT') {
    return { storeCreditRefund: shopifyValues.compact({ expiresAt }) };
  }
  return undefined;
}

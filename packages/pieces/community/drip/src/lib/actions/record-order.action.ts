import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { shopperInput, shopperProps } from '../common/shopper';
import { dripOutputSchemas } from '../output-schemas';

export const recordOrderAction = createAction({
  auth: dripAuth,
  name: 'record_order',
  displayName: 'Record Order Activity',
  description: 'Sends an order event (placed, updated, paid, fulfilled, refunded or canceled) to Drip Shopper Activity.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an e-commerce order event (placed, updated, paid, fulfilled, refunded or canceled) for a customer to Drip Shopper Activity, updating their order history and lifetime value; Drip creates the person if needed (subscribed unless New Person Status says otherwise) and workflows listening for order events may run. Drip queues it and returns a request ID. Not idempotent: each call adds an event to the timeline.',
    idempotent: false,
  },
  props: {
    accountId: dripProps.accountId(),
    action: Property.StaticDropdown({
      displayName: 'Order Action',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Placed', value: 'placed' },
          { label: 'Updated', value: 'updated' },
          { label: 'Paid', value: 'paid' },
          { label: 'Fulfilled', value: 'fulfilled' },
          { label: 'Refunded', value: 'refunded' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
    orderId: Property.ShortText({ displayName: 'Order ID', description: 'Your unique internal order ID. Provider + Order ID identify the order.', required: true }),
    email: shopperProps.email,
    personId: shopperProps.personId,
    provider: shopperProps.provider,
    initialStatus: shopperProps.initialStatus,
    occurredAt: shopperProps.occurredAt,
    orderPublicId: Property.ShortText({ displayName: 'Public Order Number', description: 'Customer-facing order number, e.g. #1001.', required: false }),
    grandTotal: Property.Number({ displayName: 'Grand Total', description: 'Order total after discounts, e.g. 49.99.', required: false }),
    totalDiscounts: Property.Number({ displayName: 'Total Discounts', required: false }),
    totalTaxes: Property.Number({ displayName: 'Total Taxes', required: false }),
    totalShipping: Property.Number({ displayName: 'Total Shipping', required: false }),
    refundAmount: Property.Number({ displayName: 'Refund Amount', description: 'For refunded or canceled orders: the amount refunded. Leave Grand Total unchanged.', required: false }),
    currency: shopperProps.currency,
    orderUrl: Property.ShortText({ displayName: 'Order URL', required: false }),
    items: Property.Json({
      displayName: 'Items',
      description: 'Optional JSON array of line items. Each needs "name"; e.g. [{"product_id": "B01", "name": "Water Bottle", "price": 11.16, "quantity": 2}].',
      required: false,
    }),
  },
  outputSchema: dripOutputSchemas.recordOrder,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const action = dripApi.requireText({ value: propsValue.action, label: 'Order Action' });
    const orderId = dripApi.requireText({ value: propsValue.orderId, label: 'Order ID' });
    const payload = {
      ...shopperInput.person({ email: propsValue.email, personId: propsValue.personId }),
      ...dripApi.compact({
        provider: shopperInput.provider(propsValue.provider),
        action,
        order_id: orderId,
        initial_status: dripApi.optionalText(propsValue.initialStatus),
        occurred_at: dripApi.parseIsoDate({ value: propsValue.occurredAt, label: 'Occurred At' }),
        order_public_id: dripApi.optionalText(propsValue.orderPublicId),
        grand_total: shopperInput.amount({ value: propsValue.grandTotal, label: 'Grand Total' }),
        total_discounts: shopperInput.amount({ value: propsValue.totalDiscounts, label: 'Total Discounts' }),
        total_taxes: shopperInput.amount({ value: propsValue.totalTaxes, label: 'Total Taxes' }),
        total_shipping: shopperInput.amount({ value: propsValue.totalShipping, label: 'Total Shipping' }),
        refund_amount: shopperInput.amount({ value: propsValue.refundAmount, label: 'Refund Amount' }),
        currency: shopperInput.currency(propsValue.currency),
        order_url: dripApi.optionalText(propsValue.orderUrl),
        items: shopperInput.items({ value: propsValue.items, required: ['name'] }),
      }),
    };
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      version: 'v3',
      path: `${dripApi.accountPath(accountId)}/shopper_activity/order`,
      operation: 'record order activity',
      body: payload,
    });
    return { requestId: shopperInput.requestId(body), orderId, action, accepted: true };
  },
});

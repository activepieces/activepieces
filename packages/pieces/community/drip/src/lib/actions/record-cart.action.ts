import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { shopperInput, shopperProps } from '../common/shopper';
import { dripOutputSchemas } from '../output-schemas';

export const recordCartAction = createAction({
  auth: dripAuth,
  name: 'record_cart',
  displayName: 'Record Cart Activity',
  description: 'Sends a cart created or updated event to Drip Shopper Activity, e.g. for abandoned-cart workflows.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      "Sends a shopping cart created or updated event for a customer to Drip Shopper Activity, with the cart link and line items, which powers abandoned-cart workflows; Drip creates the person if needed (subscribed unless New Person Status says otherwise) and workflows listening for cart events may send emails. Drip queues it and returns a request ID. Not idempotent: each call adds a cart event to the person's timeline.",
    idempotent: false,
  },
  props: {
    accountId: dripProps.accountId(),
    action: Property.StaticDropdown({
      displayName: 'Cart Action',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Updated', value: 'updated' },
        ],
      },
    }),
    cartId: Property.ShortText({ displayName: 'Cart ID', description: 'Your unique internal cart ID.', required: true }),
    cartUrl: Property.ShortText({ displayName: 'Cart URL', description: 'Link back to the shopper cart in your store.', required: true }),
    email: shopperProps.email,
    personId: shopperProps.personId,
    provider: shopperProps.provider,
    initialStatus: shopperProps.initialStatus,
    occurredAt: shopperProps.occurredAt,
    cartPublicId: Property.ShortText({ displayName: 'Public Cart Number', required: false }),
    grandTotal: Property.Number({ displayName: 'Grand Total', description: 'Cart total after discounts, e.g. 16.99.', required: false }),
    totalDiscounts: Property.Number({ displayName: 'Total Discounts', required: false }),
    currency: shopperProps.currency,
    items: Property.Json({
      displayName: 'Items',
      description:
        'Optional JSON array of cart items. Each needs "product_id", "product_variant_id", "name" and "price"; e.g. [{"product_id": "B01", "product_variant_id": "B01", "name": "Water Bottle", "price": 11.16, "quantity": 2}].',
      required: false,
    }),
  },
  outputSchema: dripOutputSchemas.recordCart,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const action = dripApi.requireText({ value: propsValue.action, label: 'Cart Action' });
    const cartId = dripApi.requireText({ value: propsValue.cartId, label: 'Cart ID' });
    const payload = {
      ...shopperInput.person({ email: propsValue.email, personId: propsValue.personId }),
      ...dripApi.compact({
        provider: shopperInput.provider(propsValue.provider),
        action,
        cart_id: cartId,
        cart_url: dripApi.requireText({ value: propsValue.cartUrl, label: 'Cart URL' }),
        initial_status: dripApi.optionalText(propsValue.initialStatus),
        occurred_at: dripApi.parseIsoDate({ value: propsValue.occurredAt, label: 'Occurred At' }),
        cart_public_id: dripApi.optionalText(propsValue.cartPublicId),
        grand_total: shopperInput.amount({ value: propsValue.grandTotal, label: 'Grand Total' }),
        total_discounts: shopperInput.amount({ value: propsValue.totalDiscounts, label: 'Total Discounts' }),
        currency: shopperInput.currency(propsValue.currency),
        items: shopperInput.items({ value: propsValue.items, required: ['product_id', 'product_variant_id', 'name', 'price'] }),
      }),
    };
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      version: 'v3',
      path: `${dripApi.accountPath(accountId)}/shopper_activity/cart`,
      operation: 'record cart activity',
      body: payload,
    });
    return { requestId: shopperInput.requestId(body), cartId, action, accepted: true };
  },
});

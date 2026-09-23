import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillmentHold,
  GqlFulfillmentOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiHoldFulfillmentOrder = createAction({
  auth: shopifyAuth,
  name: 'hold_fulfillment_order',
  classification: 'WRITE',
  displayName: 'Hold Fulfillment Order',
  description: 'Put a fulfillment order (or some of its items) on hold so it is not shipped yet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Places a fulfillment hold on one fulfillment order so it cannot be fulfilled until the hold is released with release_fulfillment_order_hold. A reason is required (for example AWAITING_PAYMENT, HIGH_RISK_OF_FRAUD, INCORRECT_ADDRESS, INVENTORY_OUT_OF_STOCK, OTHER). Leave line_items empty to hold the whole fulfillment order, or list fulfillment order line items with quantities to hold only those; Shopify then splits the rest into remaining_fulfillment_order. Returns the new hold (its id is what release_fulfillment_order_hold takes) and the held fulfillment order. Each app can have at most 10 active holds per fulfillment order, and every call adds another hold. notify_merchant is sent explicitly and defaults to false. Needs the write_merchant_managed_fulfillment_orders access scope.',
    idempotent: false,
  },
  props: {
    fulfillment_order_id: Property.ShortText({
      displayName: 'Fulfillment Order ID',
      description:
        'The fulfillment order to hold, numeric or "gid://shopify/FulfillmentOrder/…". Find it with list_order_fulfillment_orders.',
      required: true,
    }),
    reason: Property.StaticDropdown({
      displayName: 'Reason',
      description: 'Why the fulfillment order is held.',
      required: true,
      options: {
        options: [
          { label: 'Awaiting payment', value: 'AWAITING_PAYMENT' },
          { label: 'High risk of fraud', value: 'HIGH_RISK_OF_FRAUD' },
          { label: 'Incorrect address', value: 'INCORRECT_ADDRESS' },
          { label: 'Inventory out of stock', value: 'INVENTORY_OUT_OF_STOCK' },
          { label: 'Unknown delivery date', value: 'UNKNOWN_DELIVERY_DATE' },
          { label: 'Awaiting return items', value: 'AWAITING_RETURN_ITEMS' },
          { label: 'Other', value: 'OTHER' },
        ],
      },
    }),
    reason_notes: Property.LongText({
      displayName: 'Reason Notes',
      description: 'Optional details shown with the hold, for example "Waiting for the customer to confirm the address".',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description:
        'Optional unique name for this hold within your app, for example "address-check". Useful to find the hold again later.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Optional id from your own system that placed the hold.',
      required: false,
    }),
    notify_merchant: Property.Checkbox({
      displayName: 'Notify Merchant',
      description: 'Notify the merchant about the hold. Off by default.',
      required: false,
      defaultValue: false,
    }),
    line_items: shopifyProps.fulfillmentOrderLineItems({
      description:
        'Optional partial hold: the fulfillment order line items and quantities to hold. Leave empty to hold the whole fulfillment order.',
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'FulfillmentOrder', id: propsValue.fulfillment_order_id });
    const fulfillmentHold = shopifyValues.compact({
      reason: propsValue.reason,
      reasonNotes: shopifyValues.nonEmpty(propsValue.reason_notes),
      handle: shopifyValues.nonEmpty(propsValue.handle),
      externalId: shopifyValues.nonEmpty(propsValue.external_id),
      notifyMerchant: propsValue.notify_merchant ?? false,
      fulfillmentOrderLineItems: shopifyValues.buildFulfillmentOrderLineItems(propsValue.line_items),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentOrderHold: {
        fulfillmentHold: GqlFulfillmentHold | null;
        fulfillmentOrder: GqlFulfillmentOrder | null;
        remainingFulfillmentOrder: GqlFulfillmentOrder | null;
      } | null;
    }>({
      auth,
      query: `mutation HoldFulfillmentOrder($id: ID!, $fulfillmentHold: FulfillmentOrderHoldInput!) { fulfillmentOrderHold(id: $id, fulfillmentHold: $fulfillmentHold) { fulfillmentHold { id reason reasonNotes displayReason handle heldByRequestingApp } fulfillmentOrder { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } remainingFulfillmentOrder { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } userErrors { field message code } } }`,
      variables: { id, fulfillmentHold },
    });
    const payload = data.fulfillmentOrderHold;
    const hold = payload?.fulfillmentHold;
    return {
      hold_id: hold?.id ?? null,
      hold_reason: hold?.reason ?? null,
      hold_reason_notes: hold?.reasonNotes ?? null,
      hold_display_reason: hold?.displayReason ?? null,
      hold_handle: hold?.handle ?? null,
      fulfillment_order: shopifyMappers.mapFulfillmentOrderOrNull(payload?.fulfillmentOrder),
      remaining_fulfillment_order: shopifyMappers.mapFulfillmentOrderOrNull(payload?.remainingFulfillmentOrder),
      redacted_fields: redactedFields,
    };
  },
});

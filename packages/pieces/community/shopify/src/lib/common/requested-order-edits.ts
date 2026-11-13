import { Property } from '@activepieces/pieces-framework';
import {
  GqlConnection,
  GqlMoneyBag,
  shopifyGraphqlClient,
  shopifyValues,
} from './graphql';

const REQUESTED_EDIT_REMOVALS_LIMIT = 50;

const CALCULATED_REQUESTED_EDIT_REMOVALS_LIMIT = 50;

const DECLINE_NOTE_MAX_LENGTH = 500;

const REQUESTED_EDIT_LINE_ITEM_FIELDS =
  'id name title sku variantTitle quantity currentQuantity unfulfilledQuantity variant { id } product { id }';

const REQUESTED_ORDER_EDIT_FIELDS = `id status requestedAt requestDeclinedAt requestResolvedAt createdAt updatedAt order { id name displayRequestedEditStatus } lineItems { removals(first: ${REQUESTED_EDIT_REMOVALS_LIMIT}) { pageInfo { hasNextPage } nodes { id quantity resolvedQuantity lineItem { ${REQUESTED_EDIT_LINE_ITEM_FIELDS} } } } }`;

const REQUESTED_EDIT_MONEY_FIELDS =
  'shopMoney { amount currencyCode } presentmentMoney { amount currencyCode }';

const CALCULATED_REQUESTED_ORDER_EDIT_FIELDS = `financialSummary { editSubtotalBeforeTargetAllDiscountsSet { ${REQUESTED_EDIT_MONEY_FIELDS} } editOrderLevelDiscountSubtotalSet { ${REQUESTED_EDIT_MONEY_FIELDS} } editSubtotalSet { ${REQUESTED_EDIT_MONEY_FIELDS} } editSubtotalWithCartDiscountSet { ${REQUESTED_EDIT_MONEY_FIELDS} } editTotalTaxSet { ${REQUESTED_EDIT_MONEY_FIELDS} } editTotalSet { ${REQUESTED_EDIT_MONEY_FIELDS} } } lineItems { removals(first: ${CALCULATED_REQUESTED_EDIT_REMOVALS_LIMIT}) { pageInfo { hasNextPage } nodes { quantity subtotalSet { ${REQUESTED_EDIT_MONEY_FIELDS} } totalTaxSet { ${REQUESTED_EDIT_MONEY_FIELDS} } lineItem { id name sku unfulfilledQuantity } } } }`;

function removalsProp() {
  return Property.Array({
    displayName: 'Line Items to Remove',
    description:
      'The order line items the buyer wants removed and how many units of each. Line item ids come from get_order (line_items[].id). The quantity cannot exceed the unfulfilled quantity of the line item.',
    required: true,
    properties: {
      line_item_id: Property.ShortText({
        displayName: 'Line Item ID',
        description: 'Order line item id, numeric or "gid://shopify/LineItem/…".',
        required: true,
      }),
      quantity: Property.Number({
        displayName: 'Quantity',
        description: 'How many units of this line item to remove, a whole number of at least 1.',
        required: true,
      }),
    },
  });
}

function buildRemovals(value: unknown): { lineItemId: string; quantity: number }[] {
  const seen = new Set<string>();
  const removals = shopifyValues.readRecords(value).map((item) => {
    const lineItemId = shopifyValues.readText(item['line_item_id']);
    const quantity = shopifyValues.readNumber(item['quantity']);
    if (!lineItemId) {
      throw new Error('Every line item to remove needs a line_item_id. Nothing was sent to Shopify.');
    }
    if (quantity === undefined || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error(
        `Line item ${lineItemId} needs a whole-number quantity of at least 1. Nothing was sent to Shopify.`
      );
    }
    const gid = shopifyGraphqlClient.toGid({ type: 'LineItem', id: lineItemId });
    if (seen.has(gid)) {
      throw new Error(
        `Line item ${gid} is listed more than once; give each line item once with its total quantity. Nothing was sent to Shopify.`
      );
    }
    seen.add(gid);
    return { lineItemId: gid, quantity };
  });
  if (removals.length === 0) {
    throw new Error('Provide at least one line item to remove. Nothing was sent to Shopify.');
  }
  if (removals.length > CALCULATED_REQUESTED_EDIT_REMOVALS_LIMIT) {
    throw new Error(
      `Provide at most ${CALCULATED_REQUESTED_EDIT_REMOVALS_LIMIT} line items to remove per call. Nothing was sent to Shopify.`
    );
  }
  return removals;
}

function mapRequestedOrderEdit(edit: GqlRequestedOrderEdit) {
  const removals = edit.lineItems?.removals;
  const items = (removals?.nodes ?? []).map((removal) => ({
    id: removal.id,
    quantity: removal.quantity ?? null,
    resolved_quantity: removal.resolvedQuantity ?? null,
    line_item_id: removal.lineItem?.id ?? null,
    line_item_name: removal.lineItem?.name ?? null,
    line_item_title: removal.lineItem?.title ?? null,
    sku: removal.lineItem?.sku ?? null,
    variant_title: removal.lineItem?.variantTitle ?? null,
    line_item_quantity: removal.lineItem?.quantity ?? null,
    line_item_current_quantity: removal.lineItem?.currentQuantity ?? null,
    line_item_unfulfilled_quantity: removal.lineItem?.unfulfilledQuantity ?? null,
    variant_id: removal.lineItem?.variant?.id ?? null,
    product_id: removal.lineItem?.product?.id ?? null,
  }));
  return {
    id: edit.id,
    status: edit.status ?? null,
    requested_at: edit.requestedAt ?? null,
    request_declined_at: edit.requestDeclinedAt ?? null,
    request_resolved_at: edit.requestResolvedAt ?? null,
    created_at: edit.createdAt ?? null,
    updated_at: edit.updatedAt ?? null,
    order_id: edit.order?.id ?? null,
    order_name: edit.order?.name ?? null,
    order_requested_edit_status: edit.order?.displayRequestedEditStatus ?? null,
    removals: items,
    removals_count: items.length,
    removals_truncated: removals?.pageInfo?.hasNextPage ?? false,
  };
}

function mapCalculatedRequestedOrderEdit(calculated: GqlCalculatedRequestedOrderEdit) {
  const summary = calculated.financialSummary;
  const removals = calculated.lineItems?.removals;
  const items = (removals?.nodes ?? []).map((removal) => ({
    line_item_id: removal.lineItem?.id ?? null,
    line_item_name: removal.lineItem?.name ?? null,
    sku: removal.lineItem?.sku ?? null,
    line_item_unfulfilled_quantity: removal.lineItem?.unfulfilledQuantity ?? null,
    quantity: removal.quantity ?? null,
    subtotal: shopifyValues.money(removal.subtotalSet),
    total_tax: shopifyValues.money(removal.totalTaxSet),
    presentment_subtotal: shopifyValues.presentmentMoney(removal.subtotalSet),
    presentment_total_tax: shopifyValues.presentmentMoney(removal.totalTaxSet),
  }));
  return {
    edit_subtotal_before_target_all_discounts: shopifyValues.money(
      summary?.editSubtotalBeforeTargetAllDiscountsSet
    ),
    edit_order_level_discount_subtotal: shopifyValues.money(summary?.editOrderLevelDiscountSubtotalSet),
    edit_subtotal: shopifyValues.money(summary?.editSubtotalSet),
    edit_subtotal_with_cart_discount: shopifyValues.money(summary?.editSubtotalWithCartDiscountSet),
    edit_total_tax: shopifyValues.money(summary?.editTotalTaxSet),
    edit_total: shopifyValues.money(summary?.editTotalSet),
    currency_code: summary?.editTotalSet?.shopMoney?.currencyCode ?? null,
    presentment_edit_subtotal: shopifyValues.presentmentMoney(summary?.editSubtotalSet),
    presentment_edit_total_tax: shopifyValues.presentmentMoney(summary?.editTotalTaxSet),
    presentment_edit_total: shopifyValues.presentmentMoney(summary?.editTotalSet),
    presentment_currency_code: shopifyValues.presentmentCurrency(summary?.editTotalSet),
    removals: items,
    removals_count: items.length,
    removals_truncated: removals?.pageInfo?.hasNextPage ?? false,
  };
}

function readTypedId({ type, value, label }: { type: string; value: string | undefined | null; label: string }): string {
  const trimmed = (value ?? '').trim();
  const gid = shopifyGraphqlClient.toGid({ type, id: trimmed });
  const match = gid.match(/^gid:\/\/shopify\/([A-Za-z]+)\/\d+$/);
  if (!match || match[1] !== type) {
    throw new Error(
      `${label} "${trimmed}" is not a ${type} id. Pass the number or "gid://shopify/${type}/123". Nothing was sent to Shopify.`
    );
  }
  return gid;
}

function readDeclineNote(value: string | undefined | null): string | undefined {
  const note = shopifyValues.nonEmpty(value);
  if (note !== undefined && note.length > DECLINE_NOTE_MAX_LENGTH) {
    throw new Error(
      `The decline note is ${note.length} characters; Shopify accepts at most ${DECLINE_NOTE_MAX_LENGTH}. Shorten it. Nothing was sent to Shopify.`
    );
  }
  return note;
}

export const requestedOrderEditFields = {
  REQUESTED_ORDER_EDIT_FIELDS,
  CALCULATED_REQUESTED_ORDER_EDIT_FIELDS,
  REQUESTED_EDIT_REMOVALS_LIMIT,
  DECLINE_NOTE_MAX_LENGTH,
};

export const requestedOrderEditHelpers = {
  removalsProp,
  buildRemovals,
  mapRequestedOrderEdit,
  mapCalculatedRequestedOrderEdit,
  readDeclineNote,
  readTypedId,
};

export type GqlRequestedOrderEdit = {
  id: string;
  status?: string | null;
  requestedAt?: string | null;
  requestDeclinedAt?: string | null;
  requestResolvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  order?: { id: string; name?: string | null; displayRequestedEditStatus?: string | null } | null;
  lineItems?: {
    removals?: GqlConnection<GqlRequestedOrderEditLineItem> | null;
  } | null;
};

type GqlRequestedOrderEditLineItem = {
  id: string;
  quantity?: number | null;
  resolvedQuantity?: number | null;
  lineItem?: {
    id: string;
    name?: string | null;
    title?: string | null;
    sku?: string | null;
    variantTitle?: string | null;
    quantity?: number | null;
    currentQuantity?: number | null;
    unfulfilledQuantity?: number | null;
    variant?: { id: string } | null;
    product?: { id: string } | null;
  } | null;
};

export type GqlCalculatedRequestedOrderEdit = {
  financialSummary?: {
    editSubtotalBeforeTargetAllDiscountsSet?: GqlMoneyBag | null;
    editOrderLevelDiscountSubtotalSet?: GqlMoneyBag | null;
    editSubtotalSet?: GqlMoneyBag | null;
    editSubtotalWithCartDiscountSet?: GqlMoneyBag | null;
    editTotalTaxSet?: GqlMoneyBag | null;
    editTotalSet?: GqlMoneyBag | null;
  } | null;
  lineItems?: {
    removals?: GqlConnection<{
      quantity?: number | null;
      subtotalSet?: GqlMoneyBag | null;
      totalTaxSet?: GqlMoneyBag | null;
      lineItem?: {
        id: string;
        name?: string | null;
        sku?: string | null;
        unfulfilledQuantity?: number | null;
      } | null;
    }> | null;
  } | null;
};

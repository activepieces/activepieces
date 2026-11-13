import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { setFulfillmentOrdersDeadlineOutputSchema } from '../../output-schemas/fulfillment';

export const shopifyAiSetFulfillmentOrdersDeadline = createAction({
  auth: shopifyAuth,
  name: 'set_fulfillment_orders_deadline',
  classification: 'WRITE',
  displayName: 'Set Fulfillment Orders Deadline',
  description: 'Set the date by which one or more fulfillment orders must be fulfilled.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the same fulfillment deadline (fulfill_by) on one or more fulfillment orders. Returns success. Setting the same deadline again leaves the same state. Read the result back with get_fulfillment_order. Needs the write_merchant_managed_fulfillment_orders access scope.',
    idempotent: true,
  },
  outputSchema: setFulfillmentOrdersDeadlineOutputSchema,
  props: {
    fulfillment_order_ids: Property.Array({
      displayName: 'Fulfillment Order IDs',
      description:
        'The fulfillment orders, numeric or "gid://shopify/FulfillmentOrder/…". Find them with list_order_fulfillment_orders.',
      required: true,
    }),
    deadline: Property.DateTime({
      displayName: 'Deadline',
      description: 'The date and time by which they must be fulfilled, ISO 8601, for example "2026-10-01T17:00:00Z".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const fulfillmentOrderIds = shopifyValues.toGidList({
      type: 'FulfillmentOrder',
      value: propsValue.fulfillment_order_ids,
    });
    if (!fulfillmentOrderIds) {
      throw new Error('Provide at least one fulfillment order id. Nothing was changed.');
    }
    const fulfillmentDeadline = shopifyValues.nonEmpty(propsValue.deadline);
    if (!fulfillmentDeadline) {
      throw new Error('Provide the deadline. Nothing was changed.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentOrdersSetFulfillmentDeadline: { success?: boolean | null } | null;
    }>({
      auth,
      query: `mutation SetFulfillmentOrdersDeadline($fulfillmentOrderIds: [ID!]!, $fulfillmentDeadline: DateTime!) { fulfillmentOrdersSetFulfillmentDeadline(fulfillmentOrderIds: $fulfillmentOrderIds, fulfillmentDeadline: $fulfillmentDeadline) { success userErrors { field message code } } }`,
      variables: { fulfillmentOrderIds, fulfillmentDeadline },
    });
    return {
      success: data.fulfillmentOrdersSetFulfillmentDeadline?.success ?? false,
      fulfillment_order_ids: fulfillmentOrderIds,
      deadline: fulfillmentDeadline,
      redacted_fields: redactedFields,
    };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import {
  GqlRequestedOrderEdit,
  requestedOrderEditFields,
  requestedOrderEditHelpers,
} from '../../common/requested-order-edits';
import { requestedOrderEditOutputSchema } from '../../output-schemas/requested-order-edits';

export const shopifyAiCreateRequestedOrderEdit = createAction({
  auth: shopifyAuth,
  name: 'create_requested_order_edit',
  classification: 'WRITE',
  displayName: 'Create Requested Order Edit',
  description: 'Record a buyer request to remove unfulfilled line items from an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records, on behalf of the buyer, a request to remove unfulfilled line items (with quantities) from one order. It does not edit the order or move money: it creates a requested order edit with status REQUESTED that the merchant then resolves (resolve_requested_order_edit) or declines (decline_requested_order_edit). Take line item ids and unfulfilled quantities from get_order; the quantity cannot exceed the unfulfilled quantity. Use calculate_requested_order_edit first to preview the amounts. Returns the new requested_order_edit id. Needs the write_orders access scope. If Shopify ever answers that it APPLIED the change but withheld the result, the request exists: do not repeat it. Not idempotent: each call creates another request, so after an error or timeout call list_requested_order_edits on the order and only retry if the request is not there.',
    idempotent: false,
  },
  outputSchema: requestedOrderEditOutputSchema,
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
    line_items: requestedOrderEditHelpers.removalsProp(),
  },
  async run({ auth, propsValue }) {
    const orderId = requestedOrderEditHelpers.readTypedId({ type: 'Order', value: propsValue.order_id, label: 'order_id' });
    const removals = requestedOrderEditHelpers.buildRemovals(propsValue.line_items);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      requestedOrderEditCreate: { requestedOrderEdit: GqlRequestedOrderEdit | null } | null;
    }>({
      auth,
      query: `mutation CreateRequestedOrderEdit($input: RequestedOrderEditCreateInput!) { requestedOrderEditCreate(input: $input) { requestedOrderEdit { ${requestedOrderEditFields.REQUESTED_ORDER_EDIT_FIELDS} } userErrors { field message code } } }`,
      variables: { input: { orderId, lineItems: { removals } } },
      primaryPaths: ['requestedOrderEditCreate.requestedOrderEdit'],
    });
    const edit = data.requestedOrderEditCreate?.requestedOrderEdit;
    if (!edit) {
      throw new Error(
        `Shopify did not return the requested order edit for order ${orderId}. It may still have been created: check with list_requested_order_edits before retrying.`
      );
    }
    return {
      ...requestedOrderEditHelpers.mapRequestedOrderEdit(edit),
      redacted_fields: redactedFields,
    };
  },
});

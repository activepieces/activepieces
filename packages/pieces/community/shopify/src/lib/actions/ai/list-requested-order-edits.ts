import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import {
  GqlRequestedOrderEdit,
  requestedOrderEditFields,
  requestedOrderEditHelpers,
} from '../../common/requested-order-edits';
import { listRequestedOrderEditsOutputSchema } from '../../output-schemas/requested-order-edits';

const MAX_PAGE_SIZE = 25;
const FETCH_PAGE_SIZE = 10;

export const shopifyAiListRequestedOrderEdits = createAction({
  auth: shopifyAuth,
  name: 'list_requested_order_edits',
  classification: 'SEARCH',
  displayName: 'List Requested Order Edits',
  description: 'List the edits a buyer requested on an order, such as removing unfulfilled items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the buyer-requested order edits of one order, each with its id, status (REQUESTED = waiting for the merchant, RESOLVED, DECLINED), request, decline and resolve dates, and the line items the buyer asked to remove with quantities (up to 50 per edit, the most an edit can hold; removals_truncated tells when there are more). Also returns the order-level order_requested_edit_status (NONE, REQUESTED, RESOLVED, DECLINED). Use it to find the requested_order_edit_id for decline_requested_order_edit or resolve_requested_order_edit, and to check whether create_requested_order_edit already took effect before retrying it. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_orders access scope. Without the read_all_orders scope only orders from the last 60 days are visible. No customer contact fields are read, so protected customer data access is not needed. Read-only. Returns at most 10 edits per call, even when first is larger; pass end_cursor back as after while has_next_page is true.',
    idempotent: true,
  },
  outputSchema: listRequestedOrderEditsOutputSchema,
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = requestedOrderEditHelpers.readTypedId({ type: 'Order', value: propsValue.order_id, label: 'order_id' });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      order: {
        id: string;
        name?: string | null;
        displayRequestedEditStatus?: string | null;
        requestedOrderEdits?: GqlConnection<GqlRequestedOrderEdit> | null;
      } | null;
    }>({
      auth,
      query: `query ListRequestedOrderEdits($id: ID!, $first: Int!, $after: String) { order(id: $id) { id name displayRequestedEditStatus requestedOrderEdits(first: $first, after: $after) { nodes { ${requestedOrderEditFields.REQUESTED_ORDER_EDIT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: Math.min(shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }), FETCH_PAGE_SIZE),
        after: shopifyValues.nonEmpty(propsValue.after),
      },
      primaryPaths: ['order.requestedOrderEdits'],
    });
    if (!data.order) {
      throw new Error(`Order ${id} was not found.`);
    }
    return {
      order_id: data.order.id,
      order_name: data.order.name ?? null,
      order_requested_edit_status: data.order.displayRequestedEditStatus ?? null,
      ...shopifyMappers.toPage({
        connection: data.order.requestedOrderEdits,
        map: requestedOrderEditHelpers.mapRequestedOrderEdit,
        redactedFields,
      }),
    };
  },
});

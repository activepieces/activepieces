import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import {
  GqlRequestedOrderEdit,
  requestedOrderEditFields,
  requestedOrderEditHelpers,
} from '../../common/requested-order-edits';
import { requestedOrderEditOutputSchema } from '../../output-schemas/requested-order-edits';

export const shopifyAiResolveRequestedOrderEdit = createAction({
  auth: shopifyAuth,
  name: 'resolve_requested_order_edit',
  classification: 'WRITE',
  displayName: 'Resolve Requested Order Edit',
  description: 'Mark a buyer request to edit an order as completed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks one pending (status REQUESTED) buyer-requested order edit as completed; the status becomes RESOLVED. Use it after the merchant has handled the request (for example removed the items in the Shopify admin). Get the requested_order_edit_id from list_requested_order_edits; use decline_requested_order_edit to refuse a request instead. Returns the edit with the resolved quantity per line item. Needs the write_orders access scope. Not idempotent: an edit that is already resolved or declined is rejected, so check its status with list_requested_order_edits before retrying.',
    idempotent: false,
  },
  outputSchema: requestedOrderEditOutputSchema,
  props: {
    requested_order_edit_id: Property.ShortText({
      displayName: 'Requested Order Edit ID',
      description:
        'The requested order edit id, numeric or "gid://shopify/RequestedOrderEdit/…". Find it with list_requested_order_edits.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = requestedOrderEditHelpers.readTypedId({
      type: 'RequestedOrderEdit',
      value: propsValue.requested_order_edit_id,
      label: 'requested_order_edit_id',
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      requestedOrderEditResolve: { requestedOrderEdit: GqlRequestedOrderEdit | null } | null;
    }>({
      auth,
      query: `mutation ResolveRequestedOrderEdit($input: RequestedOrderEditResolveInput!) { requestedOrderEditResolve(input: $input) { requestedOrderEdit { ${requestedOrderEditFields.REQUESTED_ORDER_EDIT_FIELDS} } userErrors { field message code } } }`,
      variables: { input: { id } },
      primaryPaths: ['requestedOrderEditResolve.requestedOrderEdit'],
    });
    const edit = data.requestedOrderEditResolve?.requestedOrderEdit;
    if (!edit) {
      throw new Error(
        `Shopify did not return requested order edit ${id}. Check its status with list_requested_order_edits before retrying.`
      );
    }
    return {
      ...requestedOrderEditHelpers.mapRequestedOrderEdit(edit),
      redacted_fields: redactedFields,
    };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiDeleteDraftOrder = createAction({
  auth: shopifyAuth,
  name: 'delete_draft_order',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Draft Order',
  description: 'Permanently delete a draft order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one draft order. An invoice URL already sent to the customer stops working. Orders created from a completed draft are not affected. Cannot be undone; a repeat call fails because the draft is gone.',
    idempotent: false,
  },
  props: {
    draft_order_id: Property.ShortText({
      displayName: 'Draft Order ID',
      description: 'The draft order id, numeric or "gid://shopify/DraftOrder/…". Find it with list_draft_orders.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'DraftOrder', id: propsValue.draft_order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      draftOrderDelete: { deletedId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteDraftOrder($input: DraftOrderDeleteInput!) { draftOrderDelete(input: $input) { deletedId userErrors { field message } } }`,
      variables: { input: { id } },
    });
    return {
      deleted_id: data.draftOrderDelete?.deletedId ?? id,
      redacted_fields: redactedFields,
    };
  },
});

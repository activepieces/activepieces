import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deletePageOutputSchema } from '../../output-schemas/content';

export const shopifyAiDeletePage = createAction({
  auth: shopifyAuth,
  name: 'delete_page',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Online Store Page',
  description: 'Permanently delete an online store content page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one online store content page, and its URL stops working (menus linking to it break). To only hide it, use update_page with is_published No instead. Cannot be undone; a repeat call fails because the page is gone. Needs the write_content access scope.',
    idempotent: false,
  },
  outputSchema: deletePageOutputSchema,
  props: {
    page_id: Property.ShortText({
      displayName: 'Page ID',
      description: 'The page id, numeric or "gid://shopify/Page/…". Find it with list_pages.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Page', id: propsValue.page_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      pageDelete: { deletedPageId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeletePage($id: ID!) { pageDelete(id: $id) { deletedPageId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_page_id: data.pageDelete?.deletedPageId ?? id,
      redacted_fields: redactedFields,
    };
  },
});

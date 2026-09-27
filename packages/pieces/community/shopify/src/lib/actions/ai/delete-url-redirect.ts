import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deleteUrlRedirectOutputSchema } from '../../output-schemas/content';

export const shopifyAiDeleteUrlRedirect = createAction({
  auth: shopifyAuth,
  name: 'delete_url_redirect',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete URL Redirect',
  description: 'Delete a URL redirect.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one URL redirect; visitors of its old path get the page at that path again (often a 404). Recreate it with create_url_redirect if needed. A repeat call fails because the redirect is gone. Needs the write_online_store_navigation access scope.',
    idempotent: false,
  },
  outputSchema: deleteUrlRedirectOutputSchema,
  props: {
    url_redirect_id: Property.ShortText({
      displayName: 'URL Redirect ID',
      description: 'The redirect id, numeric or "gid://shopify/UrlRedirect/…". Find it with list_url_redirects.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'UrlRedirect', id: propsValue.url_redirect_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      urlRedirectDelete: { deletedUrlRedirectId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteUrlRedirect($id: ID!) { urlRedirectDelete(id: $id) { deletedUrlRedirectId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_url_redirect_id: data.urlRedirectDelete?.deletedUrlRedirectId ?? id,
      redacted_fields: redactedFields,
    };
  },
});

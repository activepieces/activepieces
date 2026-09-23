import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiDeleteArticle = createAction({
  auth: shopifyAuth,
  name: 'delete_article',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Blog Article',
  description: 'Permanently delete a blog article.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one blog article together with its comments, and its URL stops working. To only hide it, use update_article with is_published No instead. Cannot be undone; a repeat call fails because the article is gone. Needs the write_content access scope.',
    idempotent: false,
  },
  props: {
    article_id: Property.ShortText({
      displayName: 'Article ID',
      description: 'The article id, numeric or "gid://shopify/Article/…". Find it with list_articles.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Article', id: propsValue.article_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      articleDelete: { deletedArticleId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteArticle($id: ID!) { articleDelete(id: $id) { deletedArticleId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_article_id: data.articleDelete?.deletedArticleId ?? id,
      redacted_fields: redactedFields,
    };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiDeleteBlog = createAction({
  auth: shopifyAuth,
  name: 'delete_blog',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Blog',
  description: 'Permanently delete a blog and its articles.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one blog, and the blog URL stops working. Its articles and their comments may be deleted with it (not yet confirmed on a store), so treat them as lost. Cannot be undone; check the blog with get_blog (articles_count) first. A repeat call fails because the blog is gone. Needs the write_content access scope.',
    idempotent: false,
  },
  props: {
    blog_id: Property.ShortText({
      displayName: 'Blog ID',
      description: 'The blog id, numeric or "gid://shopify/Blog/…". Find it with list_blogs.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Blog', id: propsValue.blog_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      blogDelete: { deletedBlogId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteBlog($id: ID!) { blogDelete(id: $id) { deletedBlogId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_blog_id: data.blogDelete?.deletedBlogId ?? id,
      redacted_fields: redactedFields,
    };
  },
});

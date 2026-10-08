import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBlog,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { getBlogOutputSchema } from '../../output-schemas/content';

export const shopifyAiGetBlog = createAction({
  auth: shopifyAuth,
  name: 'get_blog',
  classification: 'READ',
  displayName: 'Get Blog',
  description: 'Get one blog with its article count and recent article tags.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one blog: title, handle, comment policy, template suffix, feed, articles_count and recent_article_tags (the tags used by the blog\'s 200 most recent articles). Use list_articles with this blog id to read its articles. Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: getBlogOutputSchema,
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
      blog: GqlBlog | null;
    }>({
      auth,
      query: `query GetBlog($id: ID!) { blog(id: $id) { ${shopifyFields.BLOG_DETAIL_FIELDS} } }`,
      variables: { id },
    });
    if (!data.blog) {
      throw new Error(`Blog ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapBlogDetail(data.blog),
      redacted_fields: redactedFields,
    };
  },
});

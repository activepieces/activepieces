import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCountBlogs = createAction({
  auth: shopifyAuth,
  name: 'count_blogs',
  classification: 'READ',
  displayName: 'Count Blogs',
  description: 'Count the blogs of the online store, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts the online store\'s blogs, optionally filtered with search syntax such as "title:News". Shopify stops counting at 10,000 by default; precision is AT_LEAST when it did. Use list_blogs to see them. Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify blog search syntax, for example "title:News". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      blogsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountBlogs($query: String) { blogsCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.blogsCount?.count ?? 0,
      precision: data.blogsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});

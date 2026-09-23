import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlArticle,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 160;

export const shopifyAiListArticles = createAction({
  auth: shopifyAuth,
  name: 'list_articles',
  classification: 'SEARCH',
  displayName: 'List Blog Articles',
  description: 'List or search blog articles, optionally within one blog.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists blog articles with title, handle, author, blog, summary, tags, publish state, image and comment count (not the full body; use get_article for that). Set blog_id to stay within one blog, and/or filter with Shopify search syntax such as "tag:news", "author:Jane", "published_status:published" or "updated_at:>2026-01-01". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  props: {
    blog_id: Property.ShortText({
      displayName: 'Blog ID',
      description: 'Only list articles of this blog, numeric or "gid://shopify/Blog/…". Leave empty for every blog.',
      required: false,
    }),
    query: shopifyProps.searchQuery(
      'Shopify article search syntax, for example "tag:news published_status:published" or "title:summer". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Title', value: 'TITLE' },
          { label: 'Published at', value: 'PUBLISHED_AT' },
          { label: 'Updated at', value: 'UPDATED_AT' },
          { label: 'Author', value: 'AUTHOR' },
          { label: 'Blog title', value: 'BLOG_TITLE' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const blogId = shopifyValues.legacyIdFilter(propsValue.blog_id);
    const query = shopifyValues.joinSearch([
      blogId ? `blog_id:${blogId}` : undefined,
      shopifyValues.nonEmpty(propsValue.query),
    ]);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      articles: GqlConnection<GqlArticle>;
    }>({
      auth,
      query: `query ListArticles($first: Int!, $after: String, $query: String, $sortKey: ArticleSortKeys, $reverse: Boolean) { articles(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.ARTICLE_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query,
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.articles,
      map: shopifyMappers.mapArticleSummary,
      redactedFields,
    });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBlog,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListBlogs = createAction({
  auth: shopifyAuth,
  name: 'list_blogs',
  classification: 'SEARCH',
  displayName: 'List Blogs',
  description: 'List or search the blogs of the online store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the online store\'s blogs with title, handle, comment policy, article count and feed. Optionally filter with Shopify search syntax such as "title:News" or "handle:news". Paged: pass end_cursor back as the cursor while has_next_page is true. Use get_blog for the recent article tags of one blog. Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify blog search syntax, for example "title:News" or "handle:news". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Title', value: 'TITLE' },
          { label: 'Handle', value: 'HANDLE' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      blogs: GqlConnection<GqlBlog>;
    }>({
      auth,
      query: `query ListBlogs($first: Int!, $after: String, $query: String, $sortKey: BlogSortKeys, $reverse: Boolean) { blogs(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.BLOG_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.blogs,
      map: shopifyMappers.mapBlog,
      redactedFields,
    });
  },
});

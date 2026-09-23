import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListArticleAuthors = createAction({
  auth: shopifyAuth,
  name: 'list_article_authors',
  classification: 'SEARCH',
  displayName: 'List Article Authors',
  description: 'List the author names used on blog articles.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the distinct author names used on the store\'s blog articles, for example to reuse an existing author_name in create_article or to filter list_articles with "author:<name>". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  props: {
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      articleAuthors: GqlConnection<{ name?: string | null }>;
    }>({
      auth,
      query: `query ListArticleAuthors($first: Int!, $after: String, $reverse: Boolean) { articleAuthors(first: $first, after: $after, reverse: $reverse) { nodes { name } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.articleAuthors,
      map: (author) => ({ name: author.name ?? null }),
      redactedFields,
    });
  },
});

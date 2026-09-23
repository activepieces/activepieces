import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

const MAX_TAGS = 250;

export const shopifyAiListArticleTags = createAction({
  auth: shopifyAuth,
  name: 'list_article_tags',
  classification: 'SEARCH',
  displayName: 'List Article Tags',
  description: 'List the tags used on blog articles.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tags used across the store\'s blog articles, sorted alphabetically or by popularity. This list has no paging: limit sets how many tags come back (1 to 250), and truncated is true when the result filled the limit, meaning more tags may exist. For the tags of one blog use get_blog (recent_article_tags). Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: `How many tags to return, 1 to ${MAX_TAGS}.`,
      required: true,
      defaultValue: 50,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Alphabetical (default) or most used first.',
      required: false,
      options: {
        options: [
          { label: 'Alphabetical', value: 'ALPHABETICAL' },
          { label: 'Most used first', value: 'POPULAR' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const limit = propsValue.limit;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_TAGS) {
      throw new Error(`limit must be a whole number between 1 and ${MAX_TAGS}.`);
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      articleTags: string[] | null;
    }>({
      auth,
      query: `query ListArticleTags($limit: Int!, $sort: ArticleTagSort) { articleTags(limit: $limit, sort: $sort) }`,
      variables: { limit, sort: propsValue.sort },
    });
    const items = data.articleTags ?? [];
    return {
      items,
      count: items.length,
      truncated: items.length >= limit,
      redacted_fields: redactedFields,
    };
  },
});

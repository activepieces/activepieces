import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlComment,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listCommentsOutputSchema } from '../../output-schemas/content';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListComments = createAction({
  auth: shopifyAuth,
  name: 'list_comments',
  classification: 'SEARCH',
  displayName: 'List Blog Comments',
  description: 'List or search blog comments, for example those waiting for moderation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists blog comments across the store with status (PENDING, UNAPPROVED, PUBLISHED, SPAM, REMOVED), body, author name and email, IP, the article it belongs to and dates. Filter with Shopify search syntax such as "status:pending", "published_status:unpublished" or "created_at:>2026-01-01". Paged: pass end_cursor back as the cursor while has_next_page is true. Author name, email and IP are protected customer data and may be null on stores without that access (listed in redacted_fields). Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listCommentsOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify comment search syntax, for example "status:pending" or "published_status:published". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Created at', value: 'CREATED_AT' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      comments: GqlConnection<GqlComment>;
    }>({
      auth,
      query: `query ListComments($first: Int!, $after: String, $query: String, $sortKey: CommentSortKeys, $reverse: Boolean) { comments(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.COMMENT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.comments,
      map: shopifyMappers.mapComment,
      redactedFields,
    });
  },
});

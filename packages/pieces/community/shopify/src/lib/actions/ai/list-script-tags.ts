import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlScriptTag,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListScriptTags = createAction({
  auth: shopifyAuth,
  name: 'list_script_tags',
  classification: 'SEARCH',
  displayName: 'List Script Tags',
  description: 'List the script tags that load JavaScript on the online store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists script tags: remote JavaScript files that the storefront loads on every page of a vintage (non-Online Store 2.0) theme, each with its src URL, display scope and cache flag. Script tags are a legacy surface; themes built on Online Store 2.0 ignore them. Filter by exact script URL with src, or with Shopify search syntax such as "src:https://cdn.example.com/widget.js" or "created_at:>2026-01-01". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_script_tags access scope. Read-only.',
    idempotent: true,
  },
  props: {
    src: Property.ShortText({
      displayName: 'Script URL',
      description: 'Only return script tags with exactly this src URL, for example "https://cdn.example.com/widget.js".',
      required: false,
    }),
    query: shopifyProps.searchQuery(
      'Shopify script tag search syntax, for example "created_at:>2026-01-01" or "id:>=1000". Leave empty to list all.'
    ),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      scriptTags: GqlConnection<GqlScriptTag>;
    }>({
      auth,
      query: `query ListScriptTags($first: Int!, $after: String, $query: String, $src: URL, $reverse: Boolean) { scriptTags(first: $first, after: $after, query: $query, src: $src, reverse: $reverse) { nodes { ${shopifyFields.SCRIPT_TAG_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        src: shopifyValues.nonEmpty(propsValue.src),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.scriptTags,
      map: shopifyMappers.mapScriptTag,
      redactedFields,
    });
  },
});

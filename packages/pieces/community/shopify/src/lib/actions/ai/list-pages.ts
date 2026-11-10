import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlPage,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listPagesOutputSchema } from '../../output-schemas/content';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListPages = createAction({
  auth: shopifyAuth,
  name: 'list_pages',
  classification: 'SEARCH',
  displayName: 'List Online Store Pages',
  description: 'List or search the online store\'s content pages (About, Contact, FAQ, ...).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the online store\'s content pages (such as About us, FAQ or Shipping policy pages) with title, handle, a plain-text body summary, publish state and template suffix; use get_page for the full body. Filter with Shopify search syntax such as "title:FAQ", "handle:about-us" or "published_status:published". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listPagesOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify page search syntax, for example "title:FAQ" or "published_status:unpublished". Leave empty to list all.'
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
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      pages: GqlConnection<GqlPage>;
    }>({
      auth,
      query: `query ListPages($first: Int!, $after: String, $query: String, $sortKey: PageSortKeys, $reverse: Boolean) { pages(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.PAGE_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.pages,
      map: shopifyMappers.mapPageSummary,
      redactedFields,
    });
  },
});

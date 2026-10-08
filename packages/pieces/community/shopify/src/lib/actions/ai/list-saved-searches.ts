import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlSavedSearch,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

const SAVED_SEARCH_ROOTS: Record<string, { label: string; root: string }> = {
  ORDER: { label: 'Orders (read_orders)', root: 'orderSavedSearches' },
  DRAFT_ORDER: { label: 'Draft orders (read_draft_orders)', root: 'draftOrderSavedSearches' },
  PRODUCT: { label: 'Products (read_products)', root: 'productSavedSearches' },
  COLLECTION: { label: 'Collections (read_products)', root: 'collectionSavedSearches' },
  FILE: { label: 'Files (read_files or read_themes)', root: 'fileSavedSearches' },
  URL_REDIRECT: { label: 'URL redirects (read_online_store_navigation)', root: 'urlRedirectSavedSearches' },
  CODE_DISCOUNT: { label: 'Code discounts', root: 'codeDiscountSavedSearches' },
  AUTOMATIC_DISCOUNT: { label: 'Automatic discounts', root: 'automaticDiscountSavedSearches' },
  DISCOUNT_REDEEM_CODE: { label: 'Discount redeem codes (read_discounts)', root: 'discountRedeemCodeSavedSearches' },
};
import { listSavedSearchesOutputSchema } from '../../output-schemas/store';

export const shopifyAiListSavedSearches = createAction({
  auth: shopifyAuth,
  name: 'list_saved_searches',
  classification: 'SEARCH',
  displayName: 'List Saved Searches',
  description: 'List the saved admin searches (saved filter views) of one resource type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the saved searches of one admin resource list: the named filter views staff saved in the Shopify admin (for example "Unfulfilled orders over $100" on the orders list). Each item has id (what delete_saved_search takes), name, query (the full filter string), search_terms and resource_type. resource_type is required and picks the list: ORDER, DRAFT_ORDER, PRODUCT, COLLECTION, FILE, URL_REDIRECT, CODE_DISCOUNT, AUTOMATIC_DISCOUNT or DISCOUNT_REDEEM_CODE. Customer saved searches are not listed because Shopify replaced them with customer segments. Needs the read scope of that resource: read_orders, read_draft_orders, read_products (products and collections), read_files or read_themes (files), read_online_store_navigation (URL redirects) or read_discounts (redeem codes); for code and automatic discounts read_discounts is expected (not stated on the query pages; to be confirmed). Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  props: {
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'Which admin list the saved searches belong to.',
      required: true,
      options: {
        options: Object.entries(SAVED_SEARCH_ROOTS).map(([value, entry]) => ({ label: entry.label, value })),
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  outputSchema: listSavedSearchesOutputSchema,
  async run({ auth, propsValue }) {
    const resourceType = shopifyValues.nonEmpty(propsValue.resource_type)?.toUpperCase();
    const entry = resourceType ? SAVED_SEARCH_ROOTS[resourceType] : undefined;
    if (!resourceType || !entry) {
      throw new Error(`resource_type must be one of ${Object.keys(SAVED_SEARCH_ROOTS).join(', ')}.`);
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<
      Record<string, GqlConnection<GqlSavedSearch> | null>
    >({
      auth,
      query: `query ListSavedSearches($first: Int!, $after: String, $reverse: Boolean) { ${entry.root}(first: $first, after: $after, reverse: $reverse) { nodes { ${shopifyFields.SAVED_SEARCH_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data[entry.root],
      map: shopifyMappers.mapSavedSearch,
      redactedFields,
    });
  },
});

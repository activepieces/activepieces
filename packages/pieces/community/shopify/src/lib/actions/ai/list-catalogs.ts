import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCatalog,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 200;
import { listCatalogsOutputSchema } from '../../output-schemas/store';

export const shopifyAiListCatalogs = createAction({
  auth: shopifyAuth,
  name: 'list_catalogs',
  classification: 'SEARCH',
  displayName: 'List Catalogs',
  description: 'List the store\'s catalogs (market, B2B company-location and app catalogs).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists catalogs, which control which products are published and at what prices in a given context: market catalogs (per Markets market), company-location catalogs (B2B) and app catalogs. Each item has its type, title, status, price list (id, name, currency), publication id and, for market or company-location catalogs, how many markets or locations use it. Plan requirement: B2B company-location catalogs exist only on Shopify Plus stores, so on other plans expect only market catalogs or an empty list. Filter by type, or with Shopify search syntax such as "title:wholesale", "status:ACTIVE" or "market_id:123". Paged: pass end_cursor back as the cursor while has_next_page is true. The required access scope is not documented (read_products or read_markets expected). Read-only.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Catalog Type',
      description: 'Only catalogs of this type. Leave empty for all types.',
      required: false,
      options: {
        options: [
          { label: 'Market', value: 'MARKET' },
          { label: 'Company location (B2B)', value: 'COMPANY_LOCATION' },
          { label: 'App', value: 'APP' },
          { label: 'None', value: 'NONE' },
        ],
      },
    }),
    query: shopifyProps.searchQuery(
      'Shopify catalog search syntax, for example "title:wholesale", "status:ACTIVE" or "company_id:123". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Title', value: 'TITLE' },
          { label: 'Type', value: 'TYPE' },
          { label: 'Relevance (with a query)', value: 'RELEVANCE' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  outputSchema: listCatalogsOutputSchema,
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      catalogs: GqlConnection<GqlCatalog>;
    }>({
      auth,
      query: `query ListCatalogs($first: Int!, $after: String, $type: CatalogType, $query: String, $sortKey: CatalogSortKeys, $reverse: Boolean) { catalogs(first: $first, after: $after, type: $type, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.CATALOG_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        type: propsValue.type,
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.catalogs,
      map: shopifyMappers.mapCatalog,
      redactedFields,
    });
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlInventoryItem,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listInventoryItemsOutputSchema } from '../../output-schemas/products';

const MAX_PAGE_SIZE = 100;

export const shopifyAiListInventoryItems = createAction({
  auth: shopifyAuth,
  name: 'list_inventory_items',
  classification: 'SEARCH',
  displayName: 'Search Inventory Items',
  description: 'Search inventory items by SKU or id, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches inventory items with Shopify search syntax (for example "sku:TSHIRT-RED-L", "sku:TSHIRT*" or "id:>=30322695") and returns one page with SKU, tracking, cost and the linked variant and product. Use it to turn a SKU into the inventory item id the inventory actions need. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_inventory access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listInventoryItemsOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify inventory item search syntax, for example "sku:TSHIRT-RED-L". Leave empty to list all.'
    ),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      inventoryItems: GqlConnection<GqlInventoryItem>;
    }>({
      auth,
      query: `query ListInventoryItems($first: Int!, $after: String, $query: String, $reverse: Boolean) { inventoryItems(first: $first, after: $after, query: $query, reverse: $reverse) { nodes { ${shopifyFields.INVENTORY_ITEM_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.inventoryItems,
      map: shopifyMappers.mapInventoryItem,
      redactedFields,
    });
  },
});

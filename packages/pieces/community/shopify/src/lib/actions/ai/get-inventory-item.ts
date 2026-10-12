import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlInventoryItem,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { inventoryItemOutputSchema } from '../../output-schemas/products';

export const shopifyAiGetInventoryItem = createAction({
  auth: shopifyAuth,
  name: 'get_inventory_item',
  classification: 'READ',
  displayName: 'Get Inventory Item',
  description: 'Get one inventory item with its SKU, cost, tracking and shipping details.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one inventory item (the stock-keeping record behind a variant): SKU, whether stock is tracked, unit cost, weight, customs data (country of origin, HS code), how many locations stock it, and its variant and product. For quantities per location use list_inventory_levels. Needs the read_inventory access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: inventoryItemOutputSchema,
  props: {
    inventory_item_id: Property.ShortText({
      displayName: 'Inventory Item ID',
      description: 'The inventory item id, numeric or "gid://shopify/InventoryItem/…" (from get_product_variant_details).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'InventoryItem', id: propsValue.inventory_item_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      inventoryItem: GqlInventoryItem | null;
    }>({
      auth,
      query: `query GetInventoryItem($id: ID!) { inventoryItem(id: $id) { ${shopifyFields.INVENTORY_ITEM_FIELDS} } }`,
      variables: { id },
    });
    if (!data.inventoryItem) {
      throw new Error(`Inventory item ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapInventoryItem(data.inventoryItem),
      redacted_fields: redactedFields,
    };
  },
});

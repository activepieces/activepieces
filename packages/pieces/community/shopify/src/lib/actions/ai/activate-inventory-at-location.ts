import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlInventoryLevel,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { activateInventoryAtLocationOutputSchema } from '../../output-schemas/products';

export const shopifyAiActivateInventoryAtLocation = createAction({
  auth: shopifyAuth,
  name: 'activate_inventory_at_location',
  classification: 'WRITE',
  displayName: 'Stock Item at Location',
  description: 'Start tracking an inventory item at a location, optionally with a starting quantity.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts stocking one inventory item at one location (creates its inventory level there), optionally with a starting available quantity. Activating an item that is already stocked there leaves it stocked. Generate your own idempotency_key (for example a UUID) on the first call and pass the same key on every retry; the key used is returned and is included in any error message. Undo with deactivate_inventory_at_location.',
    idempotent: true,
  },
  outputSchema: activateInventoryAtLocationOutputSchema,
  props: {
    inventory_item_id: Property.ShortText({
      displayName: 'Inventory Item ID',
      description: 'The inventory item id, numeric or "gid://shopify/InventoryItem/…" (from get_product_variant_details).',
      required: true,
    }),
    location_id: Property.ShortText({
      displayName: 'Location ID',
      description: 'The location id, numeric or "gid://shopify/Location/…" (from list_locations).',
      required: true,
    }),
    available: Property.Number({
      displayName: 'Starting Available Quantity',
      description: 'Optional whole-number available quantity to start with, for example 10.',
      required: false,
    }),
    idempotency_key: shopifyProps.idempotencyKey(),
  },
  async run({ auth, propsValue }) {
    const available = shopifyValues.readNumber(propsValue.available);
    if (available !== undefined && !Number.isInteger(available)) {
      throw new Error('available must be a whole number.');
    }
    const idempotencyKey = shopifyGraphqlClient.resolveIdempotencyKey(propsValue.idempotency_key);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      inventoryActivate: { inventoryLevel: GqlInventoryLevel | null } | null;
    }>({
      auth,
      query: `mutation ActivateInventoryAtLocation($inventoryItemId: ID!, $locationId: ID!, $available: Int, $idempotencyKey: String!) { inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId, available: $available) @idempotent(key: $idempotencyKey) { inventoryLevel { ${shopifyFields.INVENTORY_LEVEL_FIELDS} } userErrors { field message } } }`,
      variables: {
        inventoryItemId: shopifyGraphqlClient.toGid({ type: 'InventoryItem', id: propsValue.inventory_item_id }),
        locationId: shopifyGraphqlClient.toGid({ type: 'Location', id: propsValue.location_id }),
        available,
      },
      idempotencyKey,
    });
    const level = data.inventoryActivate?.inventoryLevel;
    if (!level) {
      throw new Error('Shopify did not return the inventory level.');
    }
    return {
      ...shopifyMappers.mapInventoryLevel(level),
      idempotency_key: idempotencyKey,
      redacted_fields: redactedFields,
    };
  },
});

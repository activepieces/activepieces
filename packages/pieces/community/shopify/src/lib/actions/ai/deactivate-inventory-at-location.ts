import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deactivateInventoryAtLocationOutputSchema } from '../../output-schemas/products';

export const shopifyAiDeactivateInventoryAtLocation = createAction({
  auth: shopifyAuth,
  name: 'deactivate_inventory_at_location',
  classification: 'DESTRUCTIVE',
  displayName: 'Stop Stocking Item at Location',
  description: 'Stop tracking an inventory item at a location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Stops stocking one inventory item at one location: looks up the item\'s inventory level at that location, then removes it, discarding the quantities recorded there. An item must stay stocked at one location at least, and Shopify can refuse for other reasons, for example stock still committed to orders; the refusal reason is returned and nothing is changed. Re-stock with activate_inventory_at_location. A repeat call fails because the level is gone.',
    idempotent: false,
  },
  outputSchema: deactivateInventoryAtLocationOutputSchema,
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
  },
  async run({ auth, propsValue }) {
    const inventoryItemId = shopifyGraphqlClient.toGid({ type: 'InventoryItem', id: propsValue.inventory_item_id });
    const locationId = shopifyGraphqlClient.toGid({ type: 'Location', id: propsValue.location_id });
    const lookup = await shopifyGraphqlClient.request<{
      inventoryItem: {
        id: string;
        inventoryLevel: { id: string; canDeactivate?: boolean | null; deactivationAlert?: string | null } | null;
      } | null;
    }>({
      auth,
      query: `query DeactivateInventoryLevelLookup($id: ID!, $locationId: ID!) { inventoryItem(id: $id) { id inventoryLevel(locationId: $locationId) { id canDeactivate deactivationAlert } } }`,
      variables: { id: inventoryItemId, locationId },
    });
    if (!lookup.data.inventoryItem) {
      throw new Error(`Inventory item ${inventoryItemId} was not found.`);
    }
    const level = lookup.data.inventoryItem.inventoryLevel;
    if (!level) {
      throw new Error(`Inventory item ${inventoryItemId} is not stocked at location ${locationId}.`);
    }
    if (level.canDeactivate === false) {
      throw new Error(
        `Shopify will not stop stocking this item at ${locationId}: ${level.deactivationAlert ?? 'the level cannot be deactivated'}.`
      );
    }
    const { redactedFields } = await shopifyGraphqlClient.request<{
      inventoryDeactivate: { userErrors: { field?: string[] | null; message: string }[] } | null;
    }>({
      auth,
      query: `mutation DeactivateInventoryAtLocation($inventoryLevelId: ID!) { inventoryDeactivate(inventoryLevelId: $inventoryLevelId) { userErrors { field message } } }`,
      variables: { inventoryLevelId: level.id },
    });
    return {
      deactivated: true,
      inventory_level_id: level.id,
      inventory_item_id: inventoryItemId,
      location_id: locationId,
      redacted_fields: [...lookup.redactedFields, ...redactedFields],
    };
  },
});

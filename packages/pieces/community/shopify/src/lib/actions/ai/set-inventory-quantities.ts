import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlInventoryAdjustmentGroup,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiSetInventoryQuantities = createAction({
  auth: shopifyAuth,
  name: 'set_inventory_quantities',
  classification: 'WRITE',
  displayName: 'Set Inventory Quantities',
  description: 'Set stock to an absolute number at one or more locations.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the available or on-hand quantity of inventory items at locations to an absolute number (for example 25), all in one batch under one reason. Use adjust_inventory_quantities to add or subtract instead. Optional expected_quantity per entry is a safety check: if the current quantity differs, the whole call fails with CHANGE_FROM_QUANTITY_STALE, and a blind retry after a successful call also fails that way. Generate your own idempotency_key (for example a UUID) on the first call and pass the same key on every retry so a retry is safe; the key used is returned and is included in any error message. Inventory item ids come from get_product_variant_details or list_inventory_items, location ids from list_locations.',
    idempotent: true,
  },
  props: {
    name: Property.StaticDropdown({
      displayName: 'Quantity Name',
      description: 'Which quantity to set.',
      required: true,
      options: {
        options: [
          { label: 'Available', value: 'available' },
          { label: 'On hand', value: 'on_hand' },
        ],
      },
    }),
    reason: Property.StaticDropdown({
      displayName: 'Reason',
      description: 'Why the stock changes; shown in the inventory history.',
      required: true,
      options: {
        options: [
          { label: 'Correction', value: 'correction' },
          { label: 'Cycle count', value: 'cycle_count_available' },
          { label: 'Damaged', value: 'damaged' },
          { label: 'Received', value: 'received' },
          { label: 'Restock', value: 'restock' },
          { label: 'Shrinkage', value: 'shrinkage' },
          { label: 'Promotion', value: 'promotion' },
          { label: 'Quality control', value: 'quality_control' },
          { label: 'Safety stock', value: 'safety_stock' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    quantities: Property.Array({
      displayName: 'Quantities',
      description: 'One entry per inventory item and location.',
      required: true,
      properties: {
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
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'The new absolute quantity, a whole number such as 25.',
          required: true,
        }),
        expected_quantity: Property.Number({
          displayName: 'Expected Current Quantity',
          description: 'Optional safety check: the quantity you expect right now. The call fails if stock moved in the meantime.',
          required: false,
        }),
      },
    }),
    reference_document_uri: Property.ShortText({
      displayName: 'Reference Document URI',
      description: 'Optional URI of the document behind the change, for example "gid://my-app/CycleCount/CC-1".',
      required: false,
    }),
    idempotency_key: shopifyProps.idempotencyKey(),
  },
  async run({ auth, propsValue }) {
    const quantities = shopifyValues.readRecords(propsValue.quantities).map((entry) => {
      const inventoryItemId = shopifyValues.readText(entry['inventory_item_id']);
      const locationId = shopifyValues.readText(entry['location_id']);
      const quantity = shopifyValues.readNumber(entry['quantity']);
      if (!inventoryItemId || !locationId || quantity === undefined || !Number.isInteger(quantity)) {
        throw new Error('Every entry needs an inventory_item_id, a location_id and a whole-number quantity.');
      }
      const expected = shopifyValues.readNumber(entry['expected_quantity']);
      if (expected !== undefined && !Number.isInteger(expected)) {
        throw new Error('expected_quantity must be a whole number.');
      }
      return {
        inventoryItemId: shopifyGraphqlClient.toGid({ type: 'InventoryItem', id: inventoryItemId }),
        locationId: shopifyGraphqlClient.toGid({ type: 'Location', id: locationId }),
        quantity,
        changeFromQuantity: expected ?? null,
      };
    });
    if (quantities.length === 0) {
      throw new Error('Provide at least one quantity to set.');
    }
    const idempotencyKey = shopifyGraphqlClient.resolveIdempotencyKey(propsValue.idempotency_key);
    const input = shopifyValues.compact({
      name: propsValue.name,
      reason: propsValue.reason,
      referenceDocumentUri: shopifyValues.nonEmpty(propsValue.reference_document_uri),
      quantities,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      inventorySetQuantities: { inventoryAdjustmentGroup: GqlInventoryAdjustmentGroup | null } | null;
    }>({
      auth,
      query: `mutation SetInventoryQuantities($input: InventorySetQuantitiesInput!, $idempotencyKey: String!) { inventorySetQuantities(input: $input) @idempotent(key: $idempotencyKey) { inventoryAdjustmentGroup { ${shopifyFields.INVENTORY_ADJUSTMENT_GROUP_FIELDS} } userErrors { field message code } } }`,
      variables: { input },
      idempotencyKey,
    });
    return {
      ...shopifyMappers.mapAdjustmentGroup(data.inventorySetQuantities?.inventoryAdjustmentGroup),
      idempotency_key: idempotencyKey,
      redacted_fields: redactedFields,
    };
  },
});

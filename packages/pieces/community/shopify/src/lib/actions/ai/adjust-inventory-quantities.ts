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
import { inventoryChangeOutputSchema } from '../../output-schemas/products';

export const shopifyAiAdjustInventoryQuantities = createAction({
  auth: shopifyAuth,
  name: 'adjust_inventory_quantities',
  classification: 'WRITE',
  displayName: 'Adjust Inventory Quantities',
  description: 'Increase or decrease stock by a relative amount at one or more locations.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes stock relatively: adds or subtracts a delta (for example -2 or +10) for inventory items at locations, all in one batch under one reason. Use set_inventory_quantities to set an absolute number instead. Optional expected_quantity per change is a safety check: if the current quantity differs, the whole call fails with CHANGE_FROM_QUANTITY_STALE. Adjusting any quantity name other than "available" needs a ledger_document_uri on every change (a non-Shopify URI such as "gid://my-app/StockMovement/SM-1"). Generate your own idempotency_key (for example a UUID) on the first call and pass the same key on every retry so the delta is not applied twice; the key used is returned and is included in any error message. Inventory item ids come from get_product_variant_details or list_inventory_items, location ids from list_locations.',
    idempotent: false,
  },
  outputSchema: inventoryChangeOutputSchema,
  props: {
    name: Property.StaticDropdown({
      displayName: 'Quantity Name',
      description: 'Which quantity to adjust. Anything other than "available" needs a ledger document URI on each change.',
      required: true,
      options: {
        options: [
          { label: 'Available', value: 'available' },
          { label: 'Damaged', value: 'damaged' },
          { label: 'Quality control', value: 'quality_control' },
          { label: 'Reserved', value: 'reserved' },
          { label: 'Safety stock', value: 'safety_stock' },
          { label: 'Incoming', value: 'incoming' },
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
          { label: 'Movement created', value: 'movement_created' },
          { label: 'Movement updated', value: 'movement_updated' },
          { label: 'Movement received', value: 'movement_received' },
          { label: 'Movement canceled', value: 'movement_canceled' },
          { label: 'Reservation created', value: 'reservation_created' },
          { label: 'Reservation updated', value: 'reservation_updated' },
          { label: 'Reservation deleted', value: 'reservation_deleted' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    changes: Property.Array({
      displayName: 'Changes',
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
        delta: Property.Number({
          displayName: 'Delta',
          description: 'Whole number to add (positive) or subtract (negative), for example -2.',
          required: true,
        }),
        expected_quantity: Property.Number({
          displayName: 'Expected Current Quantity',
          description: 'Optional safety check: the quantity you expect right now. The call fails if stock moved in the meantime.',
          required: false,
        }),
        ledger_document_uri: Property.ShortText({
          displayName: 'Ledger Document URI',
          description: 'Required for quantity names other than "available": a non-Shopify URI, for example "gid://my-app/StockMovement/SM-1".',
          required: false,
        }),
      },
    }),
    reference_document_uri: Property.ShortText({
      displayName: 'Reference Document URI',
      description: 'Optional URI of the document behind the change, for example "gid://my-app/PurchaseOrder/PO-1".',
      required: false,
    }),
    idempotency_key: shopifyProps.idempotencyKey(),
  },
  async run({ auth, propsValue }) {
    const name = propsValue.name;
    const changes = shopifyValues.readRecords(propsValue.changes).map((change) => {
      const inventoryItemId = shopifyValues.readText(change['inventory_item_id']);
      const locationId = shopifyValues.readText(change['location_id']);
      const delta = shopifyValues.readNumber(change['delta']);
      if (!inventoryItemId || !locationId || delta === undefined || !Number.isInteger(delta)) {
        throw new Error('Every change needs an inventory_item_id, a location_id and a whole-number delta.');
      }
      const expected = shopifyValues.readNumber(change['expected_quantity']);
      if (expected !== undefined && !Number.isInteger(expected)) {
        throw new Error('expected_quantity must be a whole number.');
      }
      const ledgerDocumentUri = shopifyValues.readText(change['ledger_document_uri']);
      if (name !== 'available' && !ledgerDocumentUri) {
        throw new Error(`Adjusting "${name}" needs a ledger_document_uri on every change, for example "gid://my-app/StockMovement/SM-1".`);
      }
      if (ledgerDocumentUri && ledgerDocumentUri.startsWith('gid://shopify/')) {
        throw new Error('ledger_document_uri must not be a Shopify id (gid://shopify/…); use your own system\'s URI.');
      }
      return {
        inventoryItemId: shopifyGraphqlClient.toGid({ type: 'InventoryItem', id: inventoryItemId }),
        locationId: shopifyGraphqlClient.toGid({ type: 'Location', id: locationId }),
        delta,
        changeFromQuantity: expected ?? null,
        ...(ledgerDocumentUri ? { ledgerDocumentUri } : {}),
      };
    });
    if (changes.length === 0) {
      throw new Error('Provide at least one change.');
    }
    const idempotencyKey = shopifyGraphqlClient.resolveIdempotencyKey(propsValue.idempotency_key);
    const input = shopifyValues.compact({
      name,
      reason: propsValue.reason,
      referenceDocumentUri: shopifyValues.nonEmpty(propsValue.reference_document_uri),
      changes,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      inventoryAdjustQuantities: { inventoryAdjustmentGroup: GqlInventoryAdjustmentGroup | null } | null;
    }>({
      auth,
      query: `mutation AdjustInventoryQuantities($input: InventoryAdjustQuantitiesInput!, $idempotencyKey: String!) { inventoryAdjustQuantities(input: $input) @idempotent(key: $idempotencyKey) { inventoryAdjustmentGroup { ${shopifyFields.INVENTORY_ADJUSTMENT_GROUP_FIELDS} } userErrors { field message code } } }`,
      variables: { input },
      idempotencyKey,
    });
    return {
      ...shopifyMappers.mapAdjustmentGroup(data.inventoryAdjustQuantities?.inventoryAdjustmentGroup),
      idempotency_key: idempotencyKey,
      redacted_fields: redactedFields,
    };
  },
});

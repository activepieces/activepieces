import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const getCatalogItemAction = createAction({
  name: 'get_catalog_item',
  classification: 'READ',
  auth: squareAuth,
  displayName: 'Get Catalog Item',
  description: 'Gets a catalog item with its variations and prices.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads one Square catalog item with its variations (IDs, SKUs, prices). Accepts an item ID or a variation ID (then returns the parent item), for example from an order line item. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    object_id: Property.ShortText({
      displayName: 'Item or Variation ID',
      description: 'The catalog item ID, or one of its variation IDs (from Search Catalog Items or an order line item).',
      required: true,
    }),
  },
  outputSchema: squareOutputSchemas.catalogItem,
  async run(context) {
    const objectId = squareInputs.requireId({ value: context.propsValue.object_id, label: 'Item or Variation ID' });
    const object = await squareOps.retrieveObject({ auth: context.auth, objectId });
    if (object['type'] === 'ITEM') {
      return squareShape.catalogItem(object);
    }
    if (object['type'] === 'ITEM_VARIATION') {
      const itemId = squareShape.str({ value: squareShape.rec({ value: object, key: 'item_variation_data' }), key: 'item_id' });
      if (itemId) {
        return squareShape.catalogItem(await squareOps.retrieveObject({ auth: context.auth, objectId: itemId }));
      }
    }
    throw new Error(`Catalog object "${objectId}" is a ${String(object['type'])}, not an item or item variation.`);
  },
});

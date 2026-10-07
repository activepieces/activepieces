import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareIdempotency } from '../../common/idempotency';
import { squareInputs } from '../../common/inputs';
import { squareOps } from '../../common/operations';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';

export const updateItemVariationPriceByIdAction = createAction({
  name: 'update_item_variation_price_by_id',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Update Item Price (by ID)',
  description: 'Changes the price, SKU or name of an item variation by variation ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the price (decimal string like "12.50"), SKU and/or name of one Square item variation by variation ID (from Search Catalog Items > variations, not the item ID). Reads the current version first. Setting the same values again is safe to retry.',
    idempotent: true,
  },
  props: {
    variation_id: squareProps.idText({ displayName: 'Variation ID', description: 'Item variation ID from Search Catalog Items.' }),
    price: Property.ShortText({ displayName: 'New Price', description: 'Decimal amount, for example 12.50.', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'Leave empty to keep the current currency.', required: false }),
    sku: Property.ShortText({ displayName: 'New SKU', required: false }),
    name: Property.ShortText({ displayName: 'New Variation Name', required: false }),
  },
  outputSchema: squareOutputSchemas.variation,
  async run(context) {
    const variationId = squareInputs.requireId({ value: context.propsValue.variation_id, label: 'Variation ID' });
    const idempotencyKey = squareIdempotency.fromContext({ context, action: 'update_item_variation_price', input: context.propsValue });
    return squareOps.updateVariation({ auth: context.auth, variationId, props: context.propsValue, idempotencyKey });
  },
});

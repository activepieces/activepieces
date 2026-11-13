import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareIdempotency } from '../common/idempotency';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const updateItemVariationPriceAction = createAction({
  name: 'update_item_variation_price',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Update Item Price',
  description: 'Changes the price, SKU or name of an item variation.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates the price, SKU or name of a variation picked from lists; agents use Update Item Price (by ID). Setting the same values again is safe.',
    idempotent: true,
  },
  props: {
    item: squareProps.catalogItem({ required: true }),
    variation_id: squareProps.variation({ required: true }),
    price: Property.ShortText({ displayName: 'New Price', description: 'For example 12.50. Leave empty to keep the price.', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'Leave empty to keep the current currency.', required: false }),
    sku: Property.ShortText({ displayName: 'New SKU', required: false }),
    name: Property.ShortText({ displayName: 'New Variation Name', required: false }),
  },
  outputSchema: squareOutputSchemas.variation,
  async run(context) {
    const variationId = squareInputs.requireId({ value: context.propsValue.variation_id, label: 'Variation' });
    const { item: _item, ...input } = context.propsValue;
    return squareIdempotency.execute({ context, action: 'update_item_variation_price', input, send: ({ idempotencyKey }) => squareOps.updateVariation({ auth: context.auth, variationId, props: context.propsValue, idempotencyKey }) });
  },
});

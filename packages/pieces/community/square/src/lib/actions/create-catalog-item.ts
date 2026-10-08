import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareIdempotency } from '../common/idempotency';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const createCatalogItemAction = createAction({
  name: 'create_catalog_item',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Create Catalog Item',
  description: 'Adds a product or service with one price to the Square catalog.',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a catalog item with one variation; agents use Create Catalog Item (by ID). A retried step returns the same item instead of repeating the write, and identical calls within one run (for example a loop with the same input) count as one; set Idempotency Key (for example to the loop item) to keep them separate. A new run writes again.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    category_id: squareProps.category({ required: false }),
    variation_name: Property.ShortText({ displayName: 'Variation Name', description: 'Defaults to "Regular".', required: false }),
    price: Property.ShortText({ displayName: 'Price', description: 'For example 12.50. Leave empty for a variable price set at checkout.', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'Three-letter code such as USD. Leave empty to use your main location currency.', required: false }),
    sku: Property.ShortText({ displayName: 'SKU', required: false }),
    idempotency_key: squareProps.idempotencyKey(),
  },
  outputSchema: squareOutputSchemas.catalogItem,
  async run(context) {
    const { idempotency_key: _ignored, ...input } = context.propsValue;
    return squareIdempotency.execute({ context, action: 'create_catalog_item', input, send: ({ idempotencyKey }) => squareOps.createCatalogItem({ auth: context.auth, props: context.propsValue, idempotencyKey }) });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const searchCatalogItemsAction = createAction({
  name: 'search_catalog_items',
  classification: 'SEARCH',
  auth: squareAuth,
  displayName: 'Search Catalog Items',
  description: 'Finds products and services in the Square catalog by name, category or location.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches the Square item catalog by text (name, SKU, description), category ID and/or location ID, and returns one page of items with their variations (variation IDs, SKUs and prices). Use it to find the variation ID needed by Create Order, inventory and price updates. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    text: Property.ShortText({ displayName: 'Search Text', description: 'Words to match in the item name, SKU or description. Leave empty to list items.', required: false }),
    category_id: Property.ShortText({ displayName: 'Category ID', required: false }),
    location_id: Property.ShortText({ displayName: 'Location ID', description: 'Only items enabled at this location.', required: false }),
    limit: squareProps.limitProp({ max: 100, fallback: 25 }),
    cursor: squareProps.cursorProp(),
  },
  outputSchema: squareOutputSchemas.catalogItems,
  async run(context) {
    const p = context.propsValue;
    const categoryId = squareInputs.optionalId({ value: p.category_id, label: 'Category ID' });
    const locationId = squareInputs.optionalId({ value: p.location_id, label: 'Location ID' });
    const body = await squareClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: ['v2', 'catalog', 'search-catalog-items'],
      body: squareOps.dropUndefined({
        text_filter: squareInputs.text(p.text),
        category_ids: categoryId ? [categoryId] : undefined,
        enabled_location_ids: locationId ? [locationId] : undefined,
        limit: squareInputs.limit({ value: p.limit, fallback: 25, max: 100 }),
        cursor: squareInputs.cursor(p.cursor),
      }),
      operation: 'search catalog items',
    });
    return squareShape.page({ items: squareShape.list({ value: body, key: 'items' }).map(squareShape.catalogItem), cursor: squareShape.str({ value: body, key: 'cursor' }) });
  },
});

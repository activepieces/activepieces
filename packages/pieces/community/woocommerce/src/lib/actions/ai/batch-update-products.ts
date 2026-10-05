import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { batchUpdateProductsOutputSchema } from '../../output-schemas';

export const wooAiBatchUpdateProducts = createAction({
  name: 'batch_update_products',
  classification: 'WRITE',
  displayName: 'Batch Update Products',
  description: 'Update the price, stock or status of up to 100 products in one call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates prices, stock quantity or status of 1 to 100 products in a single request; only the fields given for each product change. The call succeeds as a whole even when some products fail, so check each returned entry for an error. For other fields, or a single product, use update_product.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: batchUpdateProductsOutputSchema,
  props: {
    updates: Property.Array({
      displayName: 'Updates',
      description: 'One entry per product, 1 to 100 entries. Each needs the product id and at least one field to change.',
      required: true,
      properties: {
        id: Property.Number({
          displayName: 'Product ID',
          required: true,
        }),
        regular_price: Property.ShortText({
          displayName: 'Regular Price',
          description: 'Decimal string, e.g. 19.99.',
          required: false,
        }),
        sale_price: Property.ShortText({
          displayName: 'Sale Price',
          description: 'Decimal string, e.g. 14.99.',
          required: false,
        }),
        stock_quantity: Property.Number({
          displayName: 'Stock Quantity',
          description: 'Units in stock. Turns on stock management for that product.',
          required: false,
        }),
        status: Property.StaticDropdown({
          displayName: 'Status',
          required: false,
          options: { options: wooProps.productStatusOptions },
        }),
      },
    }),
  },
  async run(context) {
    const updates = context.propsValue.updates ?? [];
    if (updates.length === 0 || updates.length > 100) {
      throw new Error(`Updates must contain between 1 and 100 entries; got ${updates.length}.`);
    }
    const items = updates.map((item, index) => toBatchItem({ item, index }));
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/products/batch',
      body: { update: items },
    });
  },
});

function toBatchItem({ item, index }: { item: unknown; index: number }): Record<string, unknown> {
  const entry: Record<string, unknown> = Object(item);
  const id = Number(entry['id']);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Entry ${index + 1} has no valid product id.`);
  }
  const stock = entry['stock_quantity'];
  const hasStock = stock !== undefined && stock !== null && stock !== '';
  const fields = wooValues.pruneUndefined({
    regular_price: readText(entry['regular_price']),
    sale_price: readText(entry['sale_price']),
    manage_stock: hasStock ? true : undefined,
    stock_quantity: hasStock ? Number(stock) : undefined,
    status: readText(entry['status']),
  });
  if (Object.keys(fields).length === 0) {
    throw new Error(`Entry ${index + 1} (product ${id}) has no field to change.`);
  }
  return { id, ...fields };
}

function readText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return wooValues.nonEmpty(String(value));
}

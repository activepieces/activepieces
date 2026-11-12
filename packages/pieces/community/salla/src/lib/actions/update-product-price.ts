import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaUtils } from '../common/helpers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProducts } from '../common/products';

export const updateProductPriceAction = createAction({
  auth: sallaAuth,
  name: 'update_product_price',
  classification: 'WRITE',
  displayName: 'Update Product Price',
  description: 'Sets the price of a product by its SKU, with an optional sale price.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the price of one Salla product found by its exact SKU (TSHIRT-RED-M), with an optional sale price and sale end date. Use Update Product to change other fields or to find the product by ID. Sending the same prices again gives the same result, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.productPrice,
  props: {
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Exact SKU of the product, for example TSHIRT-RED-M.',
      placeholder: 'TSHIRT-RED-M',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'New regular price in the store currency, for example 99.5.',
      placeholder: '99.5',
      required: true,
    }),
    sale_price: Property.Number({
      displayName: 'Sale Price',
      description: 'Optional discounted price, lower than the price, for example 79. Leave empty to change only the price.',
      placeholder: '79',
      required: false,
    }),
    sale_end: Property.DateTime({
      displayName: 'Sale Ends',
      description: 'Optional last day of the sale price, in store time (Asia/Riyadh), for example 2026-11-30.',
      required: false,
    }),
  },
  async run({ auth, propsValue, store }) {
    return sallaProducts.updateProductPrice({
      auth,
      store,
      input: {
        sku: propsValue.sku,
        price: propsValue.price,
        salePrice: propsValue.sale_price ?? undefined,
        saleEnd: sallaUtils.wallClockFromDateTimeProp(propsValue.sale_end),
      },
    });
  },
});

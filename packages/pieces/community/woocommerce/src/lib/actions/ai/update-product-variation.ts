import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { productVariationOutputSchema } from '../../output-schemas';

export const wooAiUpdateProductVariation = createAction({
  name: 'update_product_variation',
  classification: 'WRITE',
  displayName: 'Update Product Variation',
  description: 'Change selected fields of one variation. Fields left empty are not changed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes only the supplied fields (price, SKU, status, stock, description) of one variation of a variable product; everything else is left as it is. Find the ids with list_product_variations. For the parent product itself use update_product.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: productVariationOutputSchema,
  props: {
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Id of the parent variable product.',
      required: true,
    }),
    variation_id: Property.Number({
      displayName: 'Variation ID',
      description: 'Id of the variation to update.',
      required: true,
    }),
    regular_price: Property.ShortText({
      displayName: 'Regular Price',
      description: 'New regular price as a decimal string, e.g. 19.99.',
      required: false,
    }),
    sale_price: Property.ShortText({
      displayName: 'Sale Price',
      description: 'New sale price as a decimal string. To remove a sale use End Sale instead.',
      required: false,
    }),
    end_sale: Property.Checkbox({
      displayName: 'End Sale',
      description: 'When on, clears the sale price so the variation sells at its regular price again.',
      required: false,
      defaultValue: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'New SKU. Must be unique in the store.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'New status. Private hides the variation from customers.',
      required: false,
      options: { options: wooProps.productStatusOptions },
    }),
    stock_quantity: Property.Number({
      displayName: 'Stock Quantity',
      description: 'New number of units in stock. Setting it turns on stock management for this variation.',
      required: false,
    }),
    stock_status: wooProps.stockStatusProp({
      description: 'New stock status. Ignored when a stock quantity is set.',
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New variation description.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const hasStock = props.stock_quantity !== undefined && props.stock_quantity !== null;
    const body = wooValues.pruneUndefined({
      regular_price: wooValues.nonEmpty(props.regular_price),
      sale_price: props.end_sale ? '' : wooValues.nonEmpty(props.sale_price),
      sku: wooValues.nonEmpty(props.sku),
      status: props.status,
      manage_stock: hasStock ? true : undefined,
      stock_quantity: hasStock ? props.stock_quantity : undefined,
      stock_status: hasStock ? undefined : props.stock_status,
      description: wooValues.nonEmpty(props.description),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('No fields to update were supplied. Provide at least one field to change.');
    }
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      path: `/products/${wooClient.encodeId(props.product_id)}/variations/${wooClient.encodeId(props.variation_id)}`,
      body,
    });
  },
});

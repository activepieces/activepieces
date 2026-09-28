import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { updateProductOutputSchema } from '../../output-schemas';

export const wooAiUpdateProduct = createAction({
  name: 'update_product',
  classification: 'WRITE',
  displayName: 'Update Product',
  description: 'Change selected fields of a product. Fields left empty are not changed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes only the supplied fields of one product by id; everything else is left as it is. Category IDs and Tag IDs replace the whole list, so include the existing ids you want to keep (read them with get_product). For several products at once use batch_update_products; for a variation use update_product_variation.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateProductOutputSchema,
  props: {
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Id of the product to update. Find it with list_products.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New product name.',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'New SKU. Must be unique in the store.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'New status.',
      required: false,
      options: { options: wooProps.productStatusOptions },
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
      description: 'When on, clears the sale price so the product sells at its regular price again.',
      required: false,
      defaultValue: false,
    }),
    stock_quantity: Property.Number({
      displayName: 'Stock Quantity',
      description: 'New number of units in stock. Setting it turns on stock management.',
      required: false,
    }),
    stock_status: wooProps.stockStatusProp({
      description: 'New stock status. Ignored when a stock quantity is set.',
    }),
    featured: wooProps.triStateProp({
      displayName: 'Featured',
      description: 'Yes marks the product as featured, No removes the mark. Leave empty to keep it.',
    }),
    catalog_visibility: Property.StaticDropdown({
      displayName: 'Catalog Visibility',
      description: 'Where the product is shown.',
      required: false,
      options: {
        options: [
          { label: 'Shop and search results', value: 'visible' },
          { label: 'Shop only', value: 'catalog' },
          { label: 'Search results only', value: 'search' },
          { label: 'Hidden', value: 'hidden' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New full description. HTML is allowed.',
      required: false,
    }),
    short_description: Property.LongText({
      displayName: 'Short Description',
      description: 'New short description. HTML is allowed.',
      required: false,
    }),
    category_ids: Property.Array({
      displayName: 'Category IDs',
      description: 'Replaces all of the product categories with these ids. Include the ones to keep.',
      required: false,
    }),
    tag_ids: Property.Array({
      displayName: 'Tag IDs',
      description: 'Replaces all of the product tags with these ids. Include the ones to keep.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const categoryIds = wooValues.toIdList(props.category_ids);
    const tagIds = wooValues.toIdList(props.tag_ids);
    const hasStock = props.stock_quantity !== undefined && props.stock_quantity !== null;
    const body = wooValues.pruneUndefined({
      name: wooValues.nonEmpty(props.name),
      sku: wooValues.nonEmpty(props.sku),
      status: props.status,
      regular_price: wooValues.nonEmpty(props.regular_price),
      sale_price: props.end_sale ? '' : wooValues.nonEmpty(props.sale_price),
      manage_stock: hasStock ? true : undefined,
      stock_quantity: hasStock ? props.stock_quantity : undefined,
      stock_status: hasStock ? undefined : props.stock_status,
      featured: wooValues.resolveTriState(props.featured),
      catalog_visibility: props.catalog_visibility,
      description: wooValues.nonEmpty(props.description),
      short_description: wooValues.nonEmpty(props.short_description),
      categories: categoryIds?.map((id) => ({ id })),
      tags: tagIds?.map((id) => ({ id })),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('No fields to update were supplied. Provide at least one field to change.');
    }
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      path: `/products/${wooClient.encodeId(props.product_id)}`,
      body,
    });
  },
});

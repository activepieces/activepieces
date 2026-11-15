import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { createProductOutputSchema } from '../../output-schemas';

export const wooAiCreateProduct = createAction({
  name: 'create_product',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Create a product. Only the name is required.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new product in the store catalog; only the name is required and it is published as a simple product unless told otherwise. Check list_products by SKU or name first, because each call creates a separate product. A variable product is created without variations.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: createProductOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Product name.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Defaults to simple.',
      required: false,
      options: { options: wooProps.productTypeOptions },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Defaults to published, which makes the product visible in the shop.',
      required: false,
      options: { options: wooProps.productStatusOptions },
    }),
    regular_price: Property.ShortText({
      displayName: 'Regular Price',
      description: 'Price as a decimal string, e.g. 19.99.',
      required: false,
    }),
    sale_price: Property.ShortText({
      displayName: 'Sale Price',
      description: 'Discounted price as a decimal string. Must be lower than the regular price.',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Stock keeping unit. Must be unique in the store.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Full product description. HTML is allowed.',
      required: false,
    }),
    short_description: Property.LongText({
      displayName: 'Short Description',
      description: 'Short summary shown near the price. HTML is allowed.',
      required: false,
    }),
    category_ids: Property.Array({
      displayName: 'Category IDs',
      description: 'Ids of the categories to put the product in. Find them with list_product_categories.',
      required: false,
    }),
    tag_ids: Property.Array({
      displayName: 'Tag IDs',
      description: 'Ids of the tags to attach. Find them with list_product_tags.',
      required: false,
    }),
    image_urls: Property.Array({
      displayName: 'Image URLs',
      description: 'Public image URLs. The first one becomes the main image. The store downloads each one, so an unreachable URL fails the call.',
      required: false,
    }),
    stock_quantity: Property.Number({
      displayName: 'Stock Quantity',
      description: 'Units in stock. Setting it turns on stock management for the product.',
      required: false,
    }),
    stock_status: wooProps.stockStatusProp({
      description: 'Stock status. Ignored when a stock quantity is set, because the quantity decides it.',
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const categoryIds = wooValues.toIdList(props.category_ids);
    const tagIds = wooValues.toIdList(props.tag_ids);
    const imageUrls = wooValues.toStringList(props.image_urls);
    const hasStock = props.stock_quantity !== undefined && props.stock_quantity !== null;
    const body = wooValues.pruneUndefined({
      name: props.name,
      type: props.type ?? 'simple',
      status: props.status ?? 'publish',
      regular_price: wooValues.nonEmpty(props.regular_price),
      sale_price: wooValues.nonEmpty(props.sale_price),
      sku: wooValues.nonEmpty(props.sku),
      description: wooValues.nonEmpty(props.description),
      short_description: wooValues.nonEmpty(props.short_description),
      categories: categoryIds?.map((id) => ({ id })),
      tags: tagIds?.map((id) => ({ id })),
      images: imageUrls?.map((src) => ({ src })),
      manage_stock: hasStock ? true : undefined,
      stock_quantity: hasStock ? props.stock_quantity : undefined,
      stock_status: hasStock ? undefined : props.stock_status,
    });
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/products',
      body,
    });
  },
});

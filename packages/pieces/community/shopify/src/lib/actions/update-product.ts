import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { updateProduct } from '../common';
import { ShopifyImage, ShopifyProduct, ShopifyProductStatuses } from '../common/types';

export const updateProductAction = createAction({
  auth: shopifyAuth,
  name: 'update_product',
  displayName: 'Update Product',
  description: 'Update an existing product.',
  audience: 'both',
  aiMetadata: { description: 'Update fields on an existing Shopify product by product ID (title, description, type, vendor, tags, status, and an optional image). Pick this to edit a known product rather than creating one; the product ID is required. Sets absolute field values, so re-running with the same input is idempotent (though a supplied image is appended each time).', idempotent: true },
  props: {
    id: Property.ShortText({
      displayName: 'Product',
      description: 'The ID of the product.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    bodyHtml: Property.LongText({
      displayName: 'Description',
      description: 'Product description (supports HTML)',
      required: false,
    }),
    productType: Property.ShortText({
      displayName: 'Product Type',
      description:
        'A categorization for the product used for filtering and searching products',
      required: false,
    }),
    productImage: Property.File({
      displayName: 'Product Image',
      description: 'The public URL or the base64 image to use',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      defaultValue: ShopifyProductStatuses.DRAFT,
      options: {
        options: [
          {
            label: 'Active',
            value: ShopifyProductStatuses.ACTIVE,
          },
          {
            label: 'Draft',
            value: ShopifyProductStatuses.DRAFT,
          },
          {
            label: 'Archived',
            value: ShopifyProductStatuses.ARCHIVED,
          },
        ],
      },
    }),
    vendor: Property.ShortText({
      displayName: 'Vendor',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'A string of comma-separated tags for filtering and search',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { id, title, bodyHtml, vendor, productType, tags, productImage } =
      propsValue;

    const images: Partial<ShopifyImage>[] | undefined = productImage
      ? [{ attachment: productImage.base64 }]
      : undefined;

    const product: Partial<ShopifyProduct> = {
      ...spreadIfDefined('title', title),
      ...spreadIfDefined('body_html', bodyHtml),
      ...spreadIfDefined('vendor', vendor),
      ...spreadIfDefined('product_type', productType),
      ...spreadIfDefined('tags', tags),
      ...spreadIfDefined('images', images),
    };

    return await updateProduct(+id, product, auth);
  },
});

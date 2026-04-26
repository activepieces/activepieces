import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { updateProduct } from '../common';
import { ShopifyProduct, ShopifyProductStatuses } from '../common/types';

export const updateProductAction = createAction({
  auth: shopifyAuth,
  name: 'update_product',
  displayName: 'Update Product',
  description: 'Update an existing product.',
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

    const updatePayload: Partial<ShopifyProduct> = {
      title,
      body_html: bodyHtml,
      vendor,
      product_type: productType,
      tags,
    };

    // Only include images when a new image is explicitly provided.
    // Sending an empty images array to Shopify would delete all existing images.
    if (productImage) {
      updatePayload.images = [{ attachment: productImage.base64 }];
    }

    return await updateProduct(+id, updatePayload, auth);
  },
});

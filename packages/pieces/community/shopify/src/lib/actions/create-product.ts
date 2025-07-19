import { Property, createAction } from '@ensemble/pieces-framework';
import { shopifyAuth } from '../..';
import { createProduct } from '../common';
import { ShopifyImage, ShopifyProductStatuses } from '../common/types';

export const createProductAction = createAction({
  auth: shopifyAuth,
  name: 'create_product',
  displayName: 'Create Product',
  description: 'Create a new product.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
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
    const { title, bodyHtml, vendor, productType, tags, productImage } =
      propsValue;

    const images: Partial<ShopifyImage>[] = [];
    if (productImage) {
      images.push({
        attachment: productImage.base64,
      });
    }

    return await createProduct(
      {
        title,
        body_html: bodyHtml,
        vendor,
        product_type: productType,
        tags,
        images,
      },
      auth
    );
  },
});

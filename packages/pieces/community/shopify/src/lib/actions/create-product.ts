import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createProduct } from '../common';
import { ShopifyImage, ShopifyProductStatuses } from '../common/types';

export const createProductAction = createAction({
  auth: shopifyAuth,
  name: 'create_product',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Create a new product.',
  audience: 'both',
  aiMetadata: { description: 'Create a new product in the Shopify store with a title and optional description, type, image, status, vendor, and tags. Not idempotent: each call adds a separate product, so calling repeatedly creates duplicates. Use only to add a brand-new product, not to update an existing one.', idempotent: false },
  propertyGroups: [
    {
      key: 'details',
      display: 'section',
      label: 'Details',
      icon: 'type',
      props: ['title', 'bodyHtml', 'productImage'],
    },
    {
      key: 'organise',
      display: 'section',
      label: 'Organise',
      icon: 'tag',
      props: ['productType', 'vendor', 'tags', 'status'],
    },
  ],
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      placeholder: 'Organic cotton T-shirt',
      required: true,
    }),
    bodyHtml: Property.LongText({
      displayName: 'Description',
      description: 'HTML is allowed.',
      placeholder: '<p>Soft and breathable.</p>',
      required: false,
    }),
    productType: Property.ShortText({
      displayName: 'Product Type',
      description: 'Your own category, used to filter products.',
      placeholder: 'Shirts',
      required: false,
      width: 'half',
    }),
    productImage: Property.File({
      displayName: 'Product Image',
      description: 'A file, or a public URL to an image.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Not sent to Shopify yet, so this choice has no effect.',
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
      placeholder: 'Acme',
      required: false,
      width: 'half',
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Separate tags with commas.',
      placeholder: 'sale, summer',
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

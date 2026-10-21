import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { updateProduct } from '../common';
import { ShopifyProductStatuses } from '../common/types';

export const updateProductAction = createAction({
  auth: shopifyAuth,
  name: 'update_product',
  classification: 'DESTRUCTIVE',
  displayName: 'Update Product',
  description: 'Update an existing product.',
  audience: 'both',
  aiMetadata: { description: 'Update fields on an existing Shopify product by product ID (title, description, type, vendor, tags, status, and an optional image). Pick this to edit a known product rather than creating one; the product ID is required. Sets absolute field values, but a supplied image is appended on every call, so repeating a call that includes an image adds duplicate images.', idempotent: false },
  propertyGroups: [
    {
      key: 'product',
      display: 'section',
      label: 'Product to update',
      icon: 'inbox',
      props: ['id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: [
        'changes_info',
        'title',
        'bodyHtml',
        'productType',
        'vendor',
        'tags',
        'productImage',
        'status',
      ],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'Product ID',
      description: "The number at the end of the product's URL in Shopify admin.",
      placeholder: '1234567890',
      required: true,
    }),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their current value.',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      placeholder: 'Organic cotton T-shirt',
      required: false,
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
      description: 'Replaces the current tags. Separate them with commas.',
      placeholder: 'sale, summer',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { id, title, bodyHtml, vendor, productType, tags, productImage } =
      propsValue;

    return await updateProduct(
      +id,
      {
        title,
        body_html: bodyHtml,
        vendor,
        product_type: productType,
        tags,
        ...(productImage
          ? { images: [{ attachment: productImage.base64 }] }
          : {}),
      },
      auth
    );
  },
});

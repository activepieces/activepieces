import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createProductImage } from '../common';

export const uploadProductImageAction = createAction({
  auth: shopifyAuth,
  name: 'upload_product_image',
  classification: 'WRITE',
  displayName: 'Upload Product Image',
  description: 'Upload a new product image.',
  audience: 'both',
  aiMetadata: { description: 'Add an image to an existing Shopify product from a public URL or base64 file; an optional position of 1 makes it the main image. Use to attach product photos; requires the product ID. Each call adds another image, so repeating it creates duplicates.', idempotent: false },
  propertyGroups: [
    {
      key: 'upload',
      display: 'section',
      label: 'Upload',
      icon: 'paperclip',
      props: ['id', 'image', 'position'],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'Product ID',
      description: "The number at the end of the product's URL in Shopify admin.",
      placeholder: '1234567890',
      required: true,
    }),
    image: Property.File({
      displayName: 'Image',
      description: 'A file, or a public URL to an image.',
      required: true,
    }),
    position: Property.Number({
      displayName: 'Position',
      description: '1 makes it the main image.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { id, image, position } = propsValue;

    return await createProductImage(
      +id,
      { attachment: image.base64, position },
      auth
    );
  },
});

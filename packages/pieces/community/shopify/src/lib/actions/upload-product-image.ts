import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createProductImage } from '../common';

export const uploadProductImageAction = createAction({
  auth: shopifyAuth,
  name: 'upload_product_image',
  displayName: 'Upload Product Image',
  description: 'Upload a new product image.',
  props: {
    id: Property.ShortText({
      displayName: 'Product',
      description: 'The ID of the product.',
      required: true,
    }),
    image: Property.File({
      displayName: 'Image',
      description: 'The public URL or the base64 image to use',
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

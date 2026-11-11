import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaUtils } from '../../common/helpers';
import { sallaOutputSchemas } from '../../common/output-schemas';
import { sallaProducts } from '../../common/products';

export const aiAddProductImageAction = createAction({
  auth: sallaAuth,
  name: 'ai_add_product_image',
  classification: 'WRITE',
  displayName: 'Add Product Image',
  description: 'Adds one image to a product from a public URL. A product can have up to 10 images.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one image to an existing Salla product from a public image URL, keeping the images it already has. This is the only way to add an image to an existing product, and a product can have up to 10 images. Each call adds another image, so a retry attaches a duplicate.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.productImage,
  props: {
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Numeric Salla product ID, for example 1672932878. Find it with List Products.',
      required: true,
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public link to a JPG, PNG, GIF or WEBP image starting with https://, for example https://cdn.example.com/shirt-back.jpg.',
      required: true,
    }),
    main: Property.StaticDropdown({
      displayName: 'Main Image',
      description: 'yes makes this the product\'s main image, no adds it as an extra image, default lets Salla decide. Default default.',
      required: false,
      defaultValue: 'default',
      options: {
        disabled: false,
        options: [
          { label: 'Salla default', value: 'default' },
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
    alt: Property.ShortText({
      displayName: 'Alt Text',
      description: 'Text that describes the image for search engines and screen readers, for example Red cotton T-shirt, back view.',
      required: false,
    }),
    sort: Property.Number({
      displayName: 'Sort Order',
      description: 'Position among the product images, a whole number where 1 is first, for example 2.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.addProductImage({
      auth,
      productId: propsValue.product_id,
      source: { type: 'url', url: propsValue.image_url },
      main: sallaUtils.triState(propsValue.main),
      sort: propsValue.sort ?? undefined,
      alt: propsValue.alt,
    });
  },
});

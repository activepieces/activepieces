import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaUtils } from '../common/helpers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { ProductImageSource, sallaProducts } from '../common/products';
import { sallaProps } from '../common/props';

export const addProductImageAction = createAction({
  auth: sallaAuth,
  name: 'add_product_image',
  classification: 'WRITE',
  displayName: 'Add Product Image',
  description: 'Adds one image to a product from a file or a public link, keeping its other images. A product can have up to 10 images.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds one image to a Salla product, by numeric product ID, from an uploaded file (up to 10 MB) or a public https:// link, and keeps the existing images. A product can have up to 10 images. Each call adds another image, so do not retry blindly.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.productImage,
  props: {
    product: sallaProps.product({ required: true }),
    source: Property.StaticDropdown<ImageSourceType, true>({
      displayName: 'Image Source',
      description: 'Upload a file (for example the output of a previous step) or give a public link such as https://cdn.example.com/shirt-front.jpg.',
      display: 'cards',
      required: true,
      defaultValue: 'file',
      options: {
        options: [
          { label: 'File', value: 'file', description: 'Upload an image file, up to 10 MB.', icon: 'paperclip' },
          { label: 'URL', value: 'url', description: 'A public link that starts with https://.', icon: 'code' },
        ],
      },
    }),
    file: Property.File({
      displayName: 'Image File',
      description: 'JPG, PNG, GIF or WEBP image up to 10 MB, for example shirt-front.jpg. Needed when Image Source is File.',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public image link that starts with https://, for example https://cdn.example.com/shirt-front.jpg. Needed when Image Source is URL.',
      placeholder: 'https://cdn.example.com/shirt-front.jpg',
      required: false,
    }),
    main: {
      ...sallaProps.triState({
        displayName: 'Main Image',
        description: 'Yes makes this the main product image. Leave on Salla default to add it after the current images.',
        unchangedLabel: 'Salla default',
      }),
      advanced: true,
    },
    alt: Property.ShortText({
      displayName: 'Alt Text',
      description: 'Short image description for screen readers and search engines, for example "Red cotton T-shirt, front view".',
      advanced: true,
      required: false,
    }),
    sort: Property.Number({
      displayName: 'Sort Order',
      description: 'Position of the image in the gallery, a whole number where 1 comes first, for example 2.',
      placeholder: '2',
      advanced: true,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.addProductImage({
      auth,
      productId: propsValue.product,
      source: imageSource({ type: propsValue.source, file: propsValue.file, url: propsValue.url }),
      main: sallaUtils.triState(propsValue.main),
      sort: propsValue.sort ?? undefined,
      alt: propsValue.alt ?? undefined,
    });
  },
});

function imageSource({ type, file, url }: { type: ImageSourceType; file: ApFile | undefined | null; url: string | undefined | null }): ProductImageSource {
  if (type === 'url') {
    const link = typeof url === 'string' ? url.trim() : '';
    if (link.length === 0) {
      throw new Error('Give the image URL, a public link such as https://cdn.example.com/shirt-front.jpg, or switch Image Source to File.');
    }
    return { type: 'url', url: link };
  }
  if (!file) {
    throw new Error('Pick the image file to upload, or switch Image Source to URL.');
  }
  return { type: 'file', file: { filename: file.filename, data: file.data, extension: file.extension } };
}

type ImageSourceType = 'file' | 'url';

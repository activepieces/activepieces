import { Property, createAction } from '@activepieces/pieces-framework';
import sharp from 'sharp';

export const getMetaData = createAction({
  name: 'get_meta_data',
  description: 'Gets metadata from an image',
  displayName: 'Get image metadata',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
  },
  async run(context) {
    const metadata = await sharp(context.propsValue.image.data).metadata();
    return metadata;
  },
});

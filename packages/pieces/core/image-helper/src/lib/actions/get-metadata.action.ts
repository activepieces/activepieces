import { Property, createAction } from '@activepieces/pieces-framework';
import * as ExifReader from 'exifreader';

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
    const tags = await ExifReader.load(context.propsValue.image.data);
    return tags;
  },
});

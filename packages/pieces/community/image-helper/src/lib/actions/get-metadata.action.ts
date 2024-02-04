import { Property, createAction } from '@activepieces/pieces-framework';

export const getMetaData = createAction({
  name: 'get_meta_data',
  description: 'Gets metadata from an image',
  displayName: 'Get image metadata',
  props: {
    image: Property.File({
      displayName: 'Image',
      description: 'The image to get metadata from',
      required: true,
    }),
  },
  async run(context) {
    const image = context.propsValue.image;
    const ExifParser = require('exif-parser');
    const parser = ExifParser.create(image.data);
    const result = parser.parse();
    return result;
  },
});

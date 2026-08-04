import { Property, createAction } from '@activepieces/pieces-framework';
import * as ExifReader from 'exifreader';

export const getMetaData = createAction({
  audience: 'both',
  name: 'get_meta_data',
  description: 'Gets metadata from an image',
  aiMetadata: { description: 'Reads the embedded EXIF/XMP/IPTC tag block of an image file and returns the parsed tags - dimensions, orientation, camera settings, timestamps, GPS. Use it to inspect an image before deciding how to transform it (for example checking orientation before rotate_image); it never alters the image and cannot write metadata back. Only tags actually present in the file are returned, so stripped or re-exported images may yield almost nothing; read-only and idempotent.', idempotent: true },
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

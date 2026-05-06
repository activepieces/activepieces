import { Property, createAction } from '@activepieces/pieces-framework';
import mime from 'mime-types';

export const imageToBase64 = createAction({
  name: 'image_to_base64',
  description: 'Converts an image to an url-like Base64 string',
  displayName: 'Image to Base64',
  props: {
    image: Property.File({
      displayName: 'Image',
      description: 'The image to convert',
      required: true,
    }),
    override_mime_type: Property.ShortText({
      displayName: 'Override mime type',
      description:
        'The mime type to use when converting the image. In case you want to override the default mime type. Example image/png',
      required: false,
    }),
  },
  async run(context) {
    const image = context.propsValue.image;
    const mimeType = mime.lookup(
      image.extension ? image.extension : 'image/png'
    );

    const actualMimeType = context.propsValue.override_mime_type
      ? context.propsValue.override_mime_type
      : mimeType;
    return `data:${actualMimeType};base64,${image.base64}`;
  },
});

import { Property, createAction } from '@activepieces/pieces-framework';
import mime from 'mime-types';

export const imageToBase64 = createAction({
  audience: 'both',
  name: 'image_to_base64',
  description: 'Converts an image to an url-like Base64 string',
  aiMetadata: { description: 'Turns an image file into an inline data URL string (data:<mime>;base64,...), inferring the MIME type from the file extension with an optional explicit override. Use it when a downstream HTTP body, HTML snippet, or vision model needs the image inlined rather than passed as a file reference; use convert_image_format first if the consumer only accepts one specific format. Base64 inflates the payload by roughly a third so very large images can hit request limits, and an override is needed when the source has no reliable extension - pure encoding, read-only and idempotent.', idempotent: true },
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

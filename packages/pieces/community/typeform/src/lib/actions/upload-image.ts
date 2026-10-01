import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { imageOutputSchema } from '../output-schemas';

export const uploadImageAction = createAction({
  auth: typeformAuth,
  name: 'upload_image',
  classification: 'WRITE',
  displayName: 'Upload Image',
  description: 'Uploads an image to the Typeform account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Upload an image to the Typeform account from a file or a public URL, to use in forms and themes. Returns the new image with its ID and link. Each call uploads another copy.',
    idempotent: false,
  },
  outputSchema: imageOutputSchema,
  props: {
    image: Property.File({
      displayName: 'Image',
      description: 'The image file, or a public URL to it.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: "Defaults to the file's own name.",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { image, fileName } = propsValue;
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.POST,
      path: '/images',
      body: {
        file_name: typeformCommon.isProvided(fileName) ? fileName.trim() : image.filename,
        image: image.base64,
      },
    });
  },
});

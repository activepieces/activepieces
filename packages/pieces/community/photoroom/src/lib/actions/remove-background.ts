import { createAction, Property } from '@activepieces/pieces-framework';
import { photoroomAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const removeBackground = createAction({
  name: 'removeBackground',
  displayName: 'Remove background',
  description: 'Remove the background of the image given as input',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes the background from an input image using the Photoroom segmentation API and writes the cutout to a file. Choose this to isolate a subject or produce a transparent-background version of a photo. Requires the raw image as a file input plus a filename for the generated output; the call is a pure transformation, so repeating it on the same image yields the same result with no extra side effect.',
    idempotent: true,
  },
  auth: photoroomAuth,
  props: {
    file: Property.File({ displayName: 'Image file', required: true }),
    filename: Property.ShortText({
      displayName: 'Generated filename',
      required: true,
    }),
  },
  async run({ auth, propsValue, files }) {
    const form = new FormData();
    form.append('image_file', new Blob([propsValue.file.data as any]));
    const response = await httpClient.sendRequest({
      url: `https://sdk.photoroom.com/v1/segment`,
      method: HttpMethod.POST,
      headers: {
        'x-api-key': auth.props.apiKey,
        'Content-Type': 'multipart/form-data',
      },
      body: form,
    });
    const imageUrl = await files.write({
      fileName: propsValue.filename,
      data: Buffer.from(response.body.result_b64, 'base64'),
    });
    return {
      fileName: propsValue.filename,
      url: imageUrl,
    };
  },
});

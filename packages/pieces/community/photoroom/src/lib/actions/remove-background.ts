import { createAction, Property } from '@activepieces/pieces-framework';
import { photoroomAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const removeBackground = createAction({
  name: 'removeBackground',
  displayName: 'Remove background',
  description: 'Remove the background of the image given as input',
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
    form.append('image_file', new Blob([propsValue.file.data]));
    const response = await httpClient.sendRequest({
      url: `https://sdk.photoroom.com/v1/segment`,
      method: HttpMethod.POST,
      headers: {
        'x-api-key': auth.apiKey,
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

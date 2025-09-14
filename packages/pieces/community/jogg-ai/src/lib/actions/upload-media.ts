import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const uploadMedia = createAction({
  name: 'uploadMedia',
  displayName: 'Upload Media',
  description: 'Generate a signed URL for file upload and get asset ID',
  auth: joggAiAuth,
  props: {
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Name of the file to upload (e.g., "image.jpg", "video.mp4")',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { filename } = propsValue;

    // Zod validation
    await propsValidation.validateZod(propsValue, {
      filename: z.string().min(1, 'Filename is required'),
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.jogg.ai/v1/upload/asset',
      headers: {
        'x-api-key': auth,
        'Content-Type': 'application/json',
      },
      body: {
        filename,
      },
    });

    return response.body;
  },
});

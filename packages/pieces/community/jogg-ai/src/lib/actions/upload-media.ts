import {
  httpClient,
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const uploadMedia = createAction({
  name: 'uploadMedia',
  displayName: 'Upload Media',
  description:
    'Generate a signed URL for file upload. Use the returned sign_url to upload your file with a PUT request.',
  auth: joggAiAuth,
  props: {
    filename: Property.ShortText({
      displayName: 'Filename',
      description:
        'Name of the file to upload with extension (e.g., "image.jpg", "video.mp4")',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { filename } = propsValue;

    await propsValidation.validateZod(propsValue, {
      filename: z
        .string()
        .min(1, 'Filename cannot be empty')
        .regex(
          /^[^/\\:*?"<>|]+\.[a-zA-Z0-9]+$/,
          'Filename must include a file extension and contain no special characters'
        ),
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

    if (response.body.code !== 0) {
      const errorMessages: Record<number, string> = {
        10104: 'Record not found',
        10105: 'Invalid API key',
        18020: 'Insufficient credit',
        18025: 'No permission to call APIs',
        40000: 'Parameter error',
        50000: 'System error',
      };

      const message =
        errorMessages[response.body.code] || `API Error: ${response.body.msg}`;
      throw new Error(message);
    }

    return response.body;
  },
});

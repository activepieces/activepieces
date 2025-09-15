import {
  httpClient,
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const getGeneratedVideo = createAction({
  name: 'getGeneratedVideo',
  displayName: 'Get Generated Video',
  description:
    'Get information about a specific generated video project using its ID',
  auth: joggAiAuth,
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project to retrieve information for',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { project_id } = propsValue;

    await propsValidation.validateZod(propsValue, {
      project_id: z.string().min(1, 'Project ID cannot be empty'),
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.jogg.ai/v1/project',
      headers: {
        'x-api-key': auth,
      },
      queryParams: {
        project_id,
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

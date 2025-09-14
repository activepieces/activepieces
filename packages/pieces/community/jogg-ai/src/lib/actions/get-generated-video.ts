import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const getGeneratedVideo = createAction({
  name: 'getGeneratedVideo',
  displayName: 'Get Generated Video',
  description: 'Get information about a specific generated video project using its ID',
  auth: joggAiAuth,
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project to retrieve information for (obtained from Create Avatar Video action)',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { project_id } = propsValue;

    // Zod validation
    await propsValidation.validateZod(propsValue, {
      project_id: z.string().min(1, 'Project ID is required'),
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

    return response.body;
  },
});

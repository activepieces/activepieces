import {
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini'
import { joggAiAuth } from '../..';
import { joggAiClient } from '../common/client';
import { joggAiOutputSchemas } from '../common/output-schemas';

export const getGeneratedVideo = createAction({
  name: 'getGeneratedVideo',
  classification: 'READ',
  displayName: 'Get Generated Video',
  description:
    'Get information about a specific generated video project using its ID',
  audience: 'human',
  outputSchema: joggAiOutputSchemas.getGeneratedVideo,
  aiMetadata: {
    description:
      'Retrieves the current status and details of a JoggAI video project by its project_id. Use to poll an in-progress avatar/template video generation job for completion or to fetch the finished video URL. Idempotent: a read-only lookup with no side effects.',
    idempotent: true,
  },
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
      project_id: z.string().check(z.minLength(1, 'Project ID cannot be empty')),
    });

    return joggAiClient.requestEnvelope({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/v1/project',
      op: 'get video',
      queryParams: {
        project_id,
      },
    });
  },
});

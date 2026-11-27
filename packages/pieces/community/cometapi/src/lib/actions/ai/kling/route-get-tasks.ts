import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingRouteGetTasksOutputSchema } from '../../../output-schemas';

export const klingRouteGetTasksAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_route_get_tasks',
  outputSchema: cometapiKlingRouteGetTasksOutputSchema,
  displayName: 'Kling Route Get Task',
  description: 'Reads the status and output of a Kling model-route task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a Kling model-route task once and returns it in data[0] with its status (submitted, processing, succeeded, failed) and, on success, the video URL in outputs. Use it for the data.id from Kling Route Text to Video, Route Image to Video, Route Omni Video or Route Motion Control; legacy /kling/v1 tasks use Kling Get Task.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The data.id returned by a Kling Route create action.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: '/tasks',
      query: { task_ids: propsValue.taskId },
    });
  },
});

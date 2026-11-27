import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingGetOmniVideoOutputSchema } from '../../../output-schemas';

export const klingGetOmniVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_get_omni_video',
  outputSchema: cometapiKlingGetOmniVideoOutputSchema,
  displayName: 'Kling Get Omni Video',
  description: 'Reads the status and result of a Kling Omni video task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a Kling Omni video task once and returns its task_status (submitted, processing, succeed, failed) and, on success, the video URLs. Use it only for tasks from Kling Create Omni Video; other legacy Kling tasks use Kling Get Task and model-route tasks use Kling Route Get Tasks. Call again later while the task is not terminal.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The task_id returned by Kling Create Omni Video.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: `/kling/v1/videos/omni-video/${encodeURIComponent(
        propsValue.taskId
      )}`,
    });
  },
});

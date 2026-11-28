import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingCreateOmniImageOutputSchema } from '../../../output-schemas';

export const klingGetOmniImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_get_omni_image',
  outputSchema: cometapiKlingCreateOmniImageOutputSchema,
  displayName: 'Kling Get Omni Image',
  description: 'Reads the status and images of a Kling Omni image task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a Kling Omni image task once by the data.task_id Kling Create Omni Image returns; data.task_status is succeed or failed when final, and data.task_result.images holds the image URLs. Call again later while it is still running. Only works for tasks created with the same API key.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The data.task_id returned by Kling Create Omni Image.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: `/kling/v1/images/omni-image/${encodeURIComponent(
        propsValue.taskId
      )}`,
    });
  },
});

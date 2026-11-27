import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiGetImageTaskOutputSchema } from '../../../output-schemas';

export const getImageTaskAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_get_image_task',
  outputSchema: cometapiGetImageTaskOutputSchema,
  displayName: 'Get Image Task',
  description: 'Reads the status and result of an async image generation task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads an async image task once, returning data.status (pending, success or failure) and, on success, the images in data.data. Takes the data.task_id that Generate Image returns when Async is true; call again later while pending.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The data.task_id returned by Generate Image with Async set to true.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/images/generations/${encodeURIComponent(propsValue.taskId)}`,
    });
  },
});

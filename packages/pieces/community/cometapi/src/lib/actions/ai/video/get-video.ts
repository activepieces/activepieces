import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiCreateVideoOutputSchema } from '../../../output-schemas';

export const getVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_get_video',
  outputSchema: cometapiCreateVideoOutputSchema,
  displayName: 'Get Video',
  description:
    'Gets the status and result of a video task started with Create Video.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the status, progress and, once completed, the video URL of a task started with Create Video, which returns the Task ID. Reads once without waiting: call again later while status is queued or in_progress, and use Download Video to save the finished MP4.',
    idempotent: true,
  },
  props: {
    taskId: cometApiAiProps.videoTaskId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/videos/${encodeURIComponent(propsValue.taskId)}`,
    });
  },
});

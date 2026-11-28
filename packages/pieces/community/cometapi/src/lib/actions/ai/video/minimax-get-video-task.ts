import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiMinimaxGetVideoTaskOutputSchema } from '../../../output-schemas';

export const minimaxGetVideoTaskAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_minimax_get_video_task',
  outputSchema: cometapiMinimaxGetVideoTaskOutputSchema,
  displayName: 'Get MiniMax Video Task',
  description: 'Gets the status of a MiniMax Conch video task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the status (Queueing, Processing, Success or Fail) and, on success, the file_id of a task started with Create MiniMax Video, which returns the task_id. Reads once without waiting: call again later until it finishes, then pass file_id and task_id to Get MiniMax File.',
    idempotent: true,
  },
  props: {
    taskId: cometApiAiProps.minimaxTaskId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/query/video_generation',
      query: { task_id: propsValue.taskId },
    });
  },
});

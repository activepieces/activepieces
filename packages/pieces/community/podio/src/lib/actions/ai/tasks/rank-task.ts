import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const rankTaskAction = createAction({
  auth: podioAuth,
  name: 'podio_rank_task',
  displayName: 'Rank Task',
  description: 'Moves a task before or after other tasks in the task list order.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Reorders one Podio task in the connected user\'s task list by placing it after one task, before another, or between the two; set at least one of After Task ID and Before Task ID. The task id comes from List Tasks, List Object Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
    after: podioAiProps.id({ required: false, displayName: 'After Task ID', description: 'The id of the task this task should come after.' }),
    before: podioAiProps.id({ required: false, displayName: 'Before Task ID', description: 'The id of the task this task should come before.' }),
  },
  async run({ auth, propsValue }) {
    const { taskId, after, before } = propsValue;
    if (!after && !before) {
      throw new Error('Set at least one of After Task ID or Before Task ID.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/task/${taskId}/rank`,
      body: podioUtils.body({ values: { after: after ? Number(after) : undefined, before: before ? Number(before) : undefined } }),
    });
  },
});

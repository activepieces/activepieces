import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const deleteTaskAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_task',
  displayName: 'Delete Task',
  description: 'Deletes a task.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one Podio task. Use Complete Task instead when the work is done. The task id comes from List Tasks, List Object Tasks or Create Task.',
    idempotent: false,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/task/${propsValue.taskId}`,
      query: podioUtils.query({
        values: { hook: podioUtils.toBool({ value: propsValue.hook }), silent: podioUtils.toBool({ value: propsValue.silent }) },
      }),
    });
  },
});

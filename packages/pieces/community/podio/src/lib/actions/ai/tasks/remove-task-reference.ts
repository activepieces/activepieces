import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const removeTaskReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_remove_task_reference',
  displayName: 'Remove Task Reference',
  description: 'Detaches a task from the object it is linked to.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Detaches one Podio task from the item, status or other object it is linked to, leaving the task itself. Use Update Task Reference to link it again. The task id comes from List Tasks, List Object Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/task/${propsValue.taskId}/ref` });
  },
});

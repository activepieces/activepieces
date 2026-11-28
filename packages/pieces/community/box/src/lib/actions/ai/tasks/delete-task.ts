import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteTaskOutputSchema } from '../../../output-schemas';

export const deleteTaskAction = createAction({
  auth: boxAuth,
  name: 'box_delete_task',
  outputSchema: boxDeleteTaskOutputSchema,
  displayName: 'Delete Task',
  description: 'Permanently deletes a task from a Box file.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a task and its assignments; it cannot be restored. Get the ID from List File Tasks.',
    idempotent: false,
  },
  props: {
    taskId: boxAiProps.taskId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/tasks/${encodeURIComponent(propsValue.taskId)}`,
    });
    return { deleted: true, taskId: propsValue.taskId };
  },
});

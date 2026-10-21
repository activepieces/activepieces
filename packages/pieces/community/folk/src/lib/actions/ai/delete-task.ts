import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const deleteTask = createAction({
  auth: folkAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Delete a Folk task.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: folkOutputSchemas.deletedTask,
  aiMetadata: {
    description: 'Permanently deletes one Folk task by ID. To finish a task instead, use Update Task with Status done. A second call fails with not found.',
    idempotent: false,
  },
  props: {
    taskId: folkAi.idProp({ displayName: 'Task ID', description: 'ID of the task to delete.' }),
  },
  async run(context) {
    const id = folkClient.idSegment({ value: context.propsValue.taskId, label: 'Task ID' });
    return folkAi.deleteRecord({ auth: context.auth, path: `/v1/tasks/${id}`, id });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { taskOutputSchema } from '../../common/output-schemas';

export const aiCompleteTask = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_complete_task',
  classification: 'WRITE',
  displayName: 'Complete Task',
  description: 'Marks a task as completed.',
  audience: 'ai',
  aiMetadata: {
    description: 'Marks a Capsule CRM task as completed by Task ID and returns the updated task. Completing an already completed task leaves it completed.',
    idempotent: true,
  },
  outputSchema: taskOutputSchema,
  props: {
    task_id: Property.ShortText({ displayName: 'Task ID', description: 'Numeric ID of the task, from List Tasks.', required: true }),
  },
  async run({ auth, propsValue }) {
    return capsuleCrmClient.updateTask({ auth, taskId: capsuleCrmClient.segment(propsValue.task_id), task: { status: 'COMPLETED' } });
  },
});

import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteTaskAssignmentAction = createAction({
  auth: boxAuth,
  name: 'box_delete_task_assignment',
  displayName: 'Delete Task Assignment',
  description: 'Unassigns a user from a Box task.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one assignment from a task, unassigning that user; reassign with Assign Task. Get the ID from List Task Assignments.',
    idempotent: false,
  },
  props: {
    taskAssignmentId: boxAiProps.taskAssignmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/task_assignments/${encodeURIComponent(propsValue.taskAssignmentId)}`,
    });
    return { deleted: true, taskAssignmentId: propsValue.taskAssignmentId };
  },
});

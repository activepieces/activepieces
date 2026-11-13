import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerUtils } from '../../common/utils';
import { microsoft365PlannerTaskOutputSchema } from '../../output-schemas';

export const assignTaskAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_assign_task',
  outputSchema: microsoft365PlannerTaskOutputSchema,
  displayName: 'Assign Task',
  description: 'Assigns users to a Planner task.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds users (IDs from List Group Members or Get Current User) as assignees of a Planner task and returns the updated task. Existing assignees stay; to remove someone use Update Task.',
    idempotent: true,
  },
  props: {
    taskId: microsoft365PlannerAiProps.taskId({ required: true }),
    userIds: microsoft365PlannerAiProps.userIds({ required: true }),
  },
  async run({ auth, propsValue }) {
    const userIds = microsoft365PlannerUtils.stringIds({
      value: propsValue.userIds,
      propName: 'User IDs',
    });
    if (userIds.length === 0) {
      throw new Error('User IDs must contain at least one user ID.');
    }
    return await microsoft365PlannerApi.patchTask({
      auth,
      taskId: propsValue.taskId,
      fields: {
        assignments: microsoft365PlannerUtils.assignmentsFor({ userIds }),
      },
    });
  },
});

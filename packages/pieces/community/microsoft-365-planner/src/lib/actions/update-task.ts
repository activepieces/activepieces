import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerUtils } from '../common/utils';
import { microsoft365PlannerSuccessOutputSchema } from '../output-schemas';

export const updateTaskAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'updateTask',
  outputSchema: microsoft365PlannerSuccessOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Task',
  description:
    'Modify existing task fields: title, due date, assignments, descriptions.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates fields on an existing Planner task identified by task ID, such as title, assignees, due/start dates, priority, and percent complete. Use to edit a task; only provided fields are changed. Idempotent: applying the same field values repeatedly leaves the task in the same end state.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerProps.planId({ required: true }),
    id: microsoft365PlannerProps.taskId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The new title of the task',
      required: false,
    }),
    assignments: microsoft365PlannerProps.assignments({ required: false }),
    dueDateTime: Property.DateTime({
      displayName: 'Due Date',
      description: 'The due date and time for the task',
      required: false,
    }),
    percentComplete: Property.Number({
      displayName: 'Percent Complete',
      description: 'The completion percentage of the task (0-100)',
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description:
        'The priority of the task between 0 and 10, with the increasing value being lower priority (0 has the highest priority and 10 has the lowest priority).',
      required: false,
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date',
      description: 'The start date and time for the task',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { planId: _planId, id, ...updateParams } = propsValue;
    if (!id) {
      throw new Error('Task ID is required to update a task.');
    }
    const formattedParams = {
      ...updateParams,
      assignments: updateParams.assignments
        ? microsoft365PlannerUtils.assignmentsFor({
            userIds: updateParams.assignments,
          })
        : undefined,
    };
    return await microsoft365PlannerApi.updateTask({
      auth,
      id,
      ...formattedParams,
    });
  },
});

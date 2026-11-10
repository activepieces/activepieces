import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerUtils } from '../common/utils';
import { microsoft365PlannerCreatedTaskOutputSchema } from '../output-schemas';

export const createTaskAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'createTask',
  outputSchema: microsoft365PlannerCreatedTaskOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Task',
  description:
    'Create a new planner task with title, assignments, due date, etc.',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a new task in a Planner plan, optionally placing it in a bucket and setting assignees, due/start dates, priority, and percent complete. Use to add work items to a plan. Each call creates a separate task, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    planId: microsoft365PlannerProps.planId({ required: true }),
    bucketId: microsoft365PlannerProps.bucketId({ required: false }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the task to be created',
      required: true,
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
    const taskParams = {
      ...propsValue,
      assignments: propsValue.assignments
        ? microsoft365PlannerUtils.assignmentsFor({
            userIds: propsValue.assignments,
          })
        : undefined,
      dueDateTime: propsValue.dueDateTime
        ? new Date(propsValue.dueDateTime).toISOString()
        : undefined,
      startDateTime: propsValue.startDateTime
        ? new Date(propsValue.startDateTime).toISOString()
        : undefined,
    };
    return await microsoft365PlannerApi.createTask({
      auth,
      ...taskParams,
    });
  },
});

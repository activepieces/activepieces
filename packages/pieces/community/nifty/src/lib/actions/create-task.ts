import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyProps } from '../common';
import { niftyOps } from '../common/operations';
import { niftyAuth } from '../auth';
import { createTaskArrayOutputSchema } from '../output-schemas';

export const createTask = createAction({
  name: 'create_task',
  classification: 'WRITE',
  auth: niftyAuth,
  displayName: 'Create Task',
  description: 'Create a task in Nifty.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new task in Nifty in a chosen project and status column, optionally in a milestone or list, as a subtask, with dates and assignees, picked from dropdowns (agents: use nifty_task_create, which takes IDs). Requires a task name and a status. Not idempotent: each call creates a separate task even with identical input.',
    idempotent: false,
  },
  props: {
    portfolio: niftyProps.portfolio({ required: false }),
    project: niftyProps.project({ required: true }),
    status: niftyProps.status({ required: true, description: 'The board column the task starts in.' }),
    milestone: niftyProps.milestone({
      required: false,
      description: 'Optional. When empty, Nifty puts the task in the project default list.',
    }),
    task_name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    task_description: Property.LongText({
      displayName: 'Task Description',
      required: false,
    }),
    parent_task: niftyProps.task({
      required: false,
      displayName: 'Parent Task',
      description: 'Optional. Pick a task to create this one as its subtask.',
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    assignees: niftyProps.members({
      required: false,
      displayName: 'Assignees',
      description: 'Optional. Members to assign to the task.',
    }),
  },
  outputSchema: createTaskArrayOutputSchema,
  async run(context) {
    const { status, task_name, task_description, milestone, parent_task, start_date, due_date, assignees } = context.propsValue;
    const task = await niftyOps.createTask({
      auth: context.auth,
      input: {
        statusId: status,
        name: task_name,
        description: task_description,
        milestoneId: milestone,
        parentTaskId: parent_task,
        startDate: start_date,
        dueDate: due_date,
        assigneeIds: assignees,
      },
    });
    return [task];
  },
});

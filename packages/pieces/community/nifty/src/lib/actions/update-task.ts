import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { niftyOps } from '../common/operations';
import { taskOutputSchema } from '../output-schemas';

export const updateTask = createAction({
  auth: niftyAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Change the name, description, status, milestone, dates or story points of a task.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates fields on a Nifty task picked from cascading project and task dropdowns (agents: use nifty_task_update, which takes IDs). Only the fields you fill change; clear options blank the description or a date. Idempotent: repeating the same update leaves the task in the same state.',
    idempotent: true,
  },
  props: {
    portfolio: niftyProps.portfolio({ required: false }),
    project: niftyProps.project({ required: true }),
    task: niftyProps.task({ required: true }),
    name: Property.ShortText({ displayName: 'New Name', required: false }),
    description: Property.LongText({ displayName: 'New Description', required: false }),
    clear_description: Property.Checkbox({ displayName: 'Clear Description', required: false, defaultValue: false }),
    status: niftyProps.status({ required: false, description: 'Move the task to this status column.' }),
    milestone: niftyProps.milestone({ required: false, description: 'Move the task to this milestone or list.' }),
    start_date: Property.DateTime({ displayName: 'Start Date', required: false }),
    clear_start_date: Property.Checkbox({ displayName: 'Clear Start Date', required: false, defaultValue: false }),
    due_date: Property.DateTime({ displayName: 'Due Date', required: false }),
    clear_due_date: Property.Checkbox({ displayName: 'Clear Due Date', required: false, defaultValue: false }),
    story_points: Property.Number({ displayName: 'Story Points', required: false }),
  },
  outputSchema: taskOutputSchema,
  async run(context) {
    const p = context.propsValue;
    return niftyOps.updateTask({
      auth: context.auth,
      input: {
        taskId: p.task,
        name: p.name,
        description: p.description,
        clearDescription: p.clear_description,
        statusId: p.status,
        milestoneId: p.milestone,
        startDate: p.start_date,
        clearStartDate: p.clear_start_date,
        dueDate: p.due_date,
        clearDueDate: p.clear_due_date,
        storyPoints: p.story_points,
      },
    });
  },
});

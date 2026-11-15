import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../../auth';
import { NIFTY_COMPLETION_OPTIONS, niftyOps } from '../../common/operations';
import { taskOutputSchema } from '../../output-schemas';

export const niftyTaskUpdate = createAction({
  auth: niftyAuth,
  name: 'nifty_task_update',
  displayName: 'Update Task (AI)',
  description: 'Updates a task by ID. Built for AI agents.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes fields on an existing Nifty task by ID: name, description, status column, milestone/list, start and due dates, story points, and completion (complete or reopen). Only the fields you pass change; use the clear options to blank the description or a date, and Add/Remove Task Assignees for people. Requires task_id and at least one change. Idempotent: repeating the same update leaves the task in the same state.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({ displayName: 'Task ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    clear_description: Property.Checkbox({ displayName: 'Clear Description', required: false, defaultValue: false }),
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'Moves the task to this status column. Get it from List Statuses.',
      required: false,
    }),
    milestone_id: Property.ShortText({ displayName: 'Milestone or List ID', required: false }),
    start_date: Property.DateTime({ displayName: 'Start Date', required: false }),
    clear_start_date: Property.Checkbox({ displayName: 'Clear Start Date', required: false, defaultValue: false }),
    due_date: Property.DateTime({ displayName: 'Due Date', required: false }),
    clear_due_date: Property.Checkbox({ displayName: 'Clear Due Date', required: false, defaultValue: false }),
    story_points: Property.Number({ displayName: 'Story Points', required: false }),
    completion: Property.StaticDropdown({
      displayName: 'Completion',
      required: false,
      defaultValue: 'unchanged',
      options: {
        options: NIFTY_COMPLETION_OPTIONS,
      },
    }),
  },
  outputSchema: taskOutputSchema,
  async run(context) {
    const p = context.propsValue;
    return niftyOps.updateTask({
      auth: context.auth,
      input: {
        taskId: p.task_id,
        name: p.name,
        description: p.description,
        clearDescription: p.clear_description,
        statusId: p.status_id,
        milestoneId: p.milestone_id,
        startDate: p.start_date,
        clearStartDate: p.clear_start_date,
        dueDate: p.due_date,
        clearDueDate: p.clear_due_date,
        storyPoints: p.story_points,
        completion: p.completion,
      },
    });
  },
});

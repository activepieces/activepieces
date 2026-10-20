import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../../auth';
import { niftyOps } from '../../common/operations';
import { taskOutputSchema } from '../../output-schemas';

export const niftyTaskCreate = createAction({
  auth: niftyAuth,
  name: 'nifty_task_create',
  displayName: 'Create Task (AI)',
  description: 'Creates a task from IDs. Built for AI agents.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a task in a Nifty project by placing it in a status column (status_id decides the project), optionally in a milestone or list, as a subtask of another task, with start/due dates, story points and assignees. Use for agents adding work items by ID; get status_id from List Statuses, milestone_id from List Milestones and member IDs from List Members. Requires status_id and name. Not idempotent: each call creates a new task.',
    idempotent: false,
  },
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'ID of the status (board column) the task starts in. It also sets the project. Get it from List Statuses.',
      required: true,
    }),
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    milestone_id: Property.ShortText({
      displayName: 'Milestone or List ID',
      description: 'Optional. When empty, Nifty uses the project default list.',
      required: false,
    }),
    parent_task_id: Property.ShortText({
      displayName: 'Parent Task ID',
      description: 'Optional. Creates the task as a subtask of this task.',
      required: false,
    }),
    start_date: Property.DateTime({ displayName: 'Start Date', description: 'ISO 8601, e.g. 2026-10-20.', required: false }),
    due_date: Property.DateTime({ displayName: 'Due Date', description: 'ISO 8601, e.g. 2026-10-27.', required: false }),
    story_points: Property.Number({ displayName: 'Story Points', required: false }),
    assignee_ids: Property.Array({
      displayName: 'Assignee IDs',
      description: 'Optional member IDs from List Members.',
      required: false,
    }),
  },
  outputSchema: taskOutputSchema,
  async run(context) {
    const p = context.propsValue;
    return niftyOps.createTask({
      auth: context.auth,
      input: {
        statusId: p.status_id,
        name: p.name,
        description: p.description,
        milestoneId: p.milestone_id,
        parentTaskId: p.parent_task_id,
        startDate: p.start_date,
        dueDate: p.due_date,
        storyPoints: p.story_points,
        assigneeIds: p.assignee_ids,
      },
    });
  },
});

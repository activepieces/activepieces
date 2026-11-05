import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { taskOutputSchema } from '../common/output-schemas';
import { streakApiCall } from '../common/client';
import { flattenStreakTask, toEmailList } from '../common/flatten';
import { StreakTask } from '../common/types';
import { boxDropdown, pipelineDropdown } from '../common/props';

export const createTaskAction = createAction({
  auth: streakAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a new task on a box.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new task (a to-do item) attached to a specific box, with task text and an optional due date and assignee emails. Use when an agent needs to add a follow-up or action item to a Streak record; requires the box key and task text. Not idempotent: each call creates another task on the box.',
    idempotent: false,
  },
  outputSchema: taskOutputSchema,
  props: {
    pipelineKey: pipelineDropdown,
    boxKey: boxDropdown,
    text: Property.ShortText({
      displayName: 'Task Text',
      description: 'The task description, shown in Streak (e.g. "Send follow-up email").',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due. Leave empty for no due date.',
      required: false,
    }),
    assignedToEmails: Property.Array({
      displayName: 'Assigned To (Emails)',
      description:
        'Email addresses of Streak users to assign this task to. Leave empty to leave unassigned.',
      required: false,
    }),
  },
  async run(context) {
    const { boxKey, text, dueDate, assignedToEmails } = context.propsValue;

    const body: Record<string, unknown> = { key: boxKey, text };
    if (dueDate) {
      body['dueDate'] = new Date(dueDate).getTime();
    }
    if (assignedToEmails && assignedToEmails.length > 0) {
      body['assignedToSharingEntries'] = toEmailList(assignedToEmails).map(
        (email) => ({ email }),
      );
    }

    const response = await streakApiCall<StreakTask>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/api/v2/boxes/${boxKey}/tasks`,
      contentType: 'application/json',
      body,
    });

    return flattenStreakTask({ task: response.body, fallbackBoxKey: boxKey });
  },
});

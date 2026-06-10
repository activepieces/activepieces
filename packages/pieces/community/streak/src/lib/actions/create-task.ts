import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { boxDropdown, pipelineDropdown } from '../common/props';

type StreakTask = {
  key: string;
  text: string;
  boxKey?: string;
  dueDate?: number;
  status?: string;
  creatorKey?: string;
  creationDate?: number;
  lastUpdatedDate?: number;
  assignedToSharingEntries?: Array<{ email?: string }>;
};

export const createTaskAction = createAction({
  auth: streakAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task on a box.',
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
      body['assignedToSharingEntries'] = (assignedToEmails as string[]).map(
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

    const task = response.body;
    return {
      task_key: task.key,
      box_key: task.boxKey ?? (boxKey as string),
      text: task.text,
      status: task.status ?? null,
      due_date_epoch_ms: task.dueDate ?? null,
      creator_key: task.creatorKey ?? null,
      creation_date_epoch_ms: task.creationDate ?? null,
      last_updated_date_epoch_ms: task.lastUpdatedDate ?? null,
      assigned_to_emails: Array.isArray(task.assignedToSharingEntries)
        ? task.assignedToSharingEntries
            .map((a) => a.email)
            .filter((e): e is string => Boolean(e))
            .join(', ')
        : null,
    };
  },
});

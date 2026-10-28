import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callsyncAuth } from '../auth';
import { callsyncApiCall, dueFields, flatten, withoutBlanks } from '../common/client';
import { contactDropdown, priorityDropdown, TASK_TYPES } from '../common/props';

export const createTask = createAction({
  auth: callsyncAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a follow-up task for a CallSync contact.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a task (call, email, follow-up, meeting or to-do) for one CallSync contact, with an optional due date, priority and reminder. Use Update Task to change or complete an existing task. Each call creates a new task, so retries duplicate.',
    idempotent: false,
  },
  props: {
    contact: contactDropdown({ required: true, description: 'The contact the task is for.' }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      defaultValue: 'FOLLOW_UP',
      options: { options: TASK_TYPES },
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    due: Property.DateTime({
      displayName: 'Due',
      description: 'The date and time are saved exactly as picked, so 10:00 stays 10:00 for your team.',
      required: false,
    }),
    priority_id: priorityDropdown(),
    show_reminder: Property.Checkbox({
      displayName: 'Remind the Team',
      required: false,
      defaultValue: false,
    }),
    reminder_minutes_before: Property.Number({
      displayName: 'Remind Minutes Before',
      required: false,
      defaultValue: 15,
    }),
  },
  async run(context) {
    const { contact, due, ...fields } = context.propsValue;
    const response = await callsyncApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: 'crm/tasks',
      body: withoutBlanks({ ...fields, ...dueFields(due), person_id: contact }),
    });
    return flatten(response.data);
  },
});

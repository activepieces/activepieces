import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistQuickAddTaskAction = createAction({
  auth: todoistAuth,
  name: 'todoist_quick_add_task',
  displayName: 'Quick Add Task',
  description: 'Create a task from a natural-language sentence.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Todoist task by parsing a natural-language sentence with inline syntax — e.g. "Buy milk tomorrow #Shopping @errands p1" sets the due date, project, label, and priority. Prefer this when you have a free-text instruction; use Create Task when you already have the fields broken out separately. Not idempotent: each call creates a new task.',
    idempotent: false,
  },
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description:
        'The task text with inline syntax. Use #Project to set the project, @label for labels, p1-p4 for priority, and natural-language dates. Example: "Submit report by Friday 5pm #Work p2".',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional note (comment) to attach to the created task.',
      required: false,
    }),
    reminder: Property.ShortText({
      displayName: 'Reminder',
      description: 'Optional natural-language reminder, e.g. "tomorrow at 9am".',
      required: false,
    }),
    auto_reminder: Property.Checkbox({
      displayName: 'Auto Reminder',
      description: 'Add a default reminder to the task if it has a due time.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { text, note, reminder, auto_reminder } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    return await todoistRestClient.tasks.quickAdd({
      token,
      text,
      note,
      reminder,
      auto_reminder,
    });
  },
});

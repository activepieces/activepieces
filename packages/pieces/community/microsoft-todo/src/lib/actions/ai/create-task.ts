import { createAction, Property } from '@activepieces/pieces-framework';
import { TodoTask } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { IMPORTANCE_OPTIONS, TASK_STATUS_OPTIONS, todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { taskOutputSchema } from '../../output-schemas';

export const microsoftTodoCreateTaskAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_create_task',
  outputSchema: taskOutputSchema,
  displayName: 'Create Task',
  description: 'Create a task in a task list.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Create a task in a Microsoft To Do task list (ID from List Task Lists) with a title and optional notes, importance, status, due, start and reminder times (UTC) and categories. Setting a reminder turns the reminder on. Not idempotent: every call adds another task, even with the same title.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the task.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Notes',
      description: 'Plain-text notes for the task.',
      required: false,
    }),
    importance: Property.StaticDropdown({
      displayName: 'Importance',
      description: 'Defaults to Normal.',
      required: false,
      options: { options: IMPORTANCE_OPTIONS },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Defaults to Not Started.',
      required: false,
      options: { options: TASK_STATUS_OPTIONS },
    }),
    due_date_time: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due, in UTC.',
      required: false,
    }),
    start_date_time: Property.DateTime({
      displayName: 'Start Date',
      description: 'When the task is scheduled to start, in UTC.',
      required: false,
    }),
    reminder_date_time: Property.DateTime({
      displayName: 'Reminder',
      description: 'When to remind the user, in UTC.',
      required: false,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description: 'Category names, matching the user\'s Outlook categories.',
      required: false,
    }),
  },
  async run(context) {
    const { list_id, title, body, importance, status, due_date_time, start_date_time, reminder_date_time, categories } =
      context.propsValue;
    const reminder = todoApi.toDateTimeTimeZone(reminder_date_time);
    const task: TodoTask = {
      title,
      ...(body ? { body: { content: body, contentType: 'text' } } : {}),
      ...(importance ? { importance: todoApi.toImportance(importance) } : {}),
      ...(status ? { status: todoApi.toStatus(status) } : {}),
      ...(due_date_time ? { dueDateTime: todoApi.toDateTimeTimeZone(due_date_time) } : {}),
      ...(start_date_time ? { startDateTime: todoApi.toDateTimeTimeZone(start_date_time) } : {}),
      ...(reminder ? { reminderDateTime: reminder, isReminderOn: true } : {}),
      ...(categories ? { categories: categories.filter((c): c is string => typeof c === 'string') } : {}),
    };
    const client = createTodoClient(context.auth);
    const created: TodoTask = await client.api(`${todoApi.listPath({ listId: list_id })}/tasks`).post(task);
    return todoApi.toTask(created);
  },
});


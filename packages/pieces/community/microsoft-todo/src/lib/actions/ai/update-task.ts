import { createAction, Property } from '@activepieces/pieces-framework';
import { TodoTask } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { IMPORTANCE_OPTIONS, TASK_STATUS_OPTIONS, todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { taskOutputSchema } from '../../output-schemas';

export const microsoftTodoUpdateTaskAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_update_task',
  outputSchema: taskOutputSchema,
  displayName: 'Update Task',
  description: 'Change fields of an existing task.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Change one or more fields of a Microsoft To Do task, identified by list ID and task ID (from List Tasks). Only the fields you provide change; the rest keep their values. To remove a due date, start date, reminder, notes or categories, pick it in Clear Fields (not together with a new value for the same field). Times are UTC. Use Complete Task to just mark it done.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Notes',
      description: 'New plain-text notes, replacing the current ones.',
      required: false,
    }),
    importance: Property.StaticDropdown({
      displayName: 'Importance',
      required: false,
      options: { options: IMPORTANCE_OPTIONS },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: TASK_STATUS_OPTIONS },
    }),
    due_date_time: Property.DateTime({
      displayName: 'Due Date',
      description: 'New due date, in UTC.',
      required: false,
    }),
    start_date_time: Property.DateTime({
      displayName: 'Start Date',
      description: 'New start date, in UTC.',
      required: false,
    }),
    reminder_date_time: Property.DateTime({
      displayName: 'Reminder',
      description: 'New reminder time, in UTC. Turns the reminder on.',
      required: false,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description: 'Category names, replacing the current ones.',
      required: false,
    }),
    clear_fields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty on the task.',
      required: false,
      options: {
        options: [
          { label: 'Due Date', value: 'dueDateTime' },
          { label: 'Start Date', value: 'startDateTime' },
          { label: 'Reminder', value: 'reminderDateTime' },
          { label: 'Notes', value: 'body' },
          { label: 'Categories', value: 'categories' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      list_id,
      task_id,
      title,
      body,
      importance,
      status,
      due_date_time,
      start_date_time,
      reminder_date_time,
      categories,
      clear_fields,
    } = context.propsValue;
    const clear = clear_fields ?? [];
    const conflicts = [
      { field: 'dueDateTime', value: due_date_time },
      { field: 'startDateTime', value: start_date_time },
      { field: 'reminderDateTime', value: reminder_date_time },
      { field: 'body', value: body },
      { field: 'categories', value: categories },
    ].filter(({ field, value }) => clear.includes(field) && value !== undefined);
    if (conflicts.length > 0) {
      throw new Error(
        `Cannot both set and clear: ${conflicts.map((c) => c.field).join(', ')}. Provide a value or clear it, not both.`,
      );
    }
    const reminder = todoApi.toDateTimeTimeZone(reminder_date_time);
    const patch: TodoTask = {
      ...(title !== undefined ? { title } : {}),
      ...(body !== undefined ? { body: { content: body, contentType: 'text' } } : {}),
      ...(importance ? { importance: todoApi.toImportance(importance) } : {}),
      ...(status ? { status: todoApi.toStatus(status) } : {}),
      ...(due_date_time ? { dueDateTime: todoApi.toDateTimeTimeZone(due_date_time) } : {}),
      ...(start_date_time ? { startDateTime: todoApi.toDateTimeTimeZone(start_date_time) } : {}),
      ...(reminder ? { reminderDateTime: reminder, isReminderOn: true } : {}),
      ...(categories !== undefined
        ? { categories: categories.filter((c): c is string => typeof c === 'string') }
        : {}),
      ...(clear.includes('dueDateTime') ? { dueDateTime: null } : {}),
      ...(clear.includes('startDateTime') ? { startDateTime: null } : {}),
      ...(clear.includes('reminderDateTime') ? { reminderDateTime: null, isReminderOn: false } : {}),
      ...(clear.includes('body') ? { body: { content: '', contentType: 'text' } } : {}),
      ...(clear.includes('categories') ? { categories: [] } : {}),
    };
    if (Object.keys(patch).length === 0) {
      throw new Error('Provide at least one field to change or clear.');
    }
    const client = createTodoClient(context.auth);
    const updated: TodoTask = await client
      .api(todoApi.taskPath({ listId: list_id, taskId: task_id }))
      .update(patch);
    return todoApi.toTask(updated);
  },
});

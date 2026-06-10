import { createAction } from '@activepieces/pieces-framework';
import { createTask, googleTasksCommon, Task, TaskStatus } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksAddNewTaskAction = createAction({
  auth: googleTasksAuth,
  name: 'add_task',
  description: 'Add a new task to a specified task list',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new task in a specific Google Tasks list, with optional notes, due date, and a completed flag. Use to add a to-do item for the authenticated user; requires a valid task-list ID (resolve it first if you only have a list name). Not idempotent: each call appends a separate task even with identical input.',
    idempotent: false,
  },
  displayName: 'Add Task',
  props: {
    tasks_list: googleTasksCommon.tasksList,
    title: googleTasksCommon.title,
    notes: googleTasksCommon.notes,
    due: googleTasksCommon.due,
    completed: googleTasksCommon.completed,
  },
  async run({ auth, propsValue }) {
    const task: Task = {
      kind: 'tasks#task',
      status: propsValue.completed
        ? TaskStatus.COMPLETED
        : TaskStatus.NEEDS_ACTION,
      title: propsValue.title,
      completed: propsValue.completed ? new Date().toISOString() : '',
      notes: propsValue.notes,
      due: propsValue.due
        ? `${new Date(propsValue.due).toISOString().split('T')[0]}T00:00:00Z`
        : undefined,
    };

    return createTask(auth, propsValue.tasks_list!, task);
  },
});

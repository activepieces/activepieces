import { createAction } from '@activepieces/pieces-framework';
import { createTask, googleTasksCommon, Task, TaskStatus } from '../common';
import { googleTasksAuth } from '../../';

export const googleTasksAddNewTaskAction = createAction({
  auth: googleTasksAuth,
  name: 'add_task',
  description: 'Add a new task to a specified task list',
  displayName: 'Add Task',
  props: {
    tasks_list: googleTasksCommon.tasksList,
    title: googleTasksCommon.title,
    notes: googleTasksCommon.notes,
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
    };

    return createTask(auth, propsValue.tasks_list!, task);
  },
});

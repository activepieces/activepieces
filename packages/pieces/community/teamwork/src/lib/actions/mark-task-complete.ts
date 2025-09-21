import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const markTaskCompleteAction = createAction({
  auth: teamworkAuth,
  name: 'mark_task_complete',
  displayName: 'Mark Task Complete',
  description: 'Sets a task’s status to complete.',
  props: {
    project_id: teamworkProps.project_id(true),
    task_list_id: teamworkProps.task_list_id(true),
    task_id: Property.Dropdown({ 
      displayName: 'Task',
      description: 'The task to mark as complete.',
      required: true,
      refreshers: ['auth', 'task_list_id'],
      options: async ({ auth, task_list_id }) => {
        if (!auth || !task_list_id) {
          return {
            disabled: true,
            placeholder: 'Please select a task list first.',
            options: [],
          };
        }
        const tasks = await teamworkClient.getTasksInTaskList(auth as TeamworkAuth, task_list_id as string);
        return {
          disabled: false,
          options: tasks.map((task) => ({
            label: task.content,
            value: task.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { task_id } = propsValue;
    
    return await teamworkClient.markTaskComplete(auth as TeamworkAuth, task_id as string);
  },
});
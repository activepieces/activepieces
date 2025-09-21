import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const updateTaskAction = createAction({
  auth: teamworkAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Modify a task’s fields.',
  props: {
    project_id: teamworkProps.project_id(true),
    task_list_id: teamworkProps.task_list_id(true),
    task_id: Property.Dropdown({ 
      displayName: 'Task',
      description: 'The task to update.',
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
    content: Property.LongText({
      displayName: 'Task Content',
      description: 'The new content/name of the task.',
      required: false,
    }),
    responsible_person_id: Property.Dropdown({
      displayName: 'Responsible Person',
      description: 'The person responsible for this task.',
      required: false,
      refreshers: ['auth', 'project_id'],
      options: async ({ auth, project_id }) => {
        if (!auth || !project_id) {
          return {
            disabled: true,
            placeholder: 'Please select a project first.',
            options: [],
          };
        }
        const people = await teamworkClient.getPeopleInProject(auth as TeamworkAuth, project_id as string);
        return {
          disabled: false,
          options: people.map((person: any) => ({
            label: person['first-name'] + ' ' + person['last-name'],
            value: person.id,
          })),
        };
      },
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'The new due date for the task.',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The new priority of the task.',
      required: false,
      options: {
        options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { task_id, content, responsible_person_id, dueDate, priority } = propsValue;

    const taskData = {
      content,
      'responsible-party-id': responsible_person_id,
      'due-date': dueDate,
      priority,
    };
    
    return await teamworkClient.updateTask(auth as TeamworkAuth, task_id as string, taskData);
  },
});
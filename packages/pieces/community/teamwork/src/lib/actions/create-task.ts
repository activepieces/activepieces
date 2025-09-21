import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createTaskAction = createAction({
  auth: teamworkAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Add a new task under a project or task list.',
  props: {
    project_id: teamworkProps.project_id(true),
    task_list_id: teamworkProps.task_list_id(false), 
    content: Property.LongText({
      displayName: 'Task Content',
      description: 'The content/name of the task.',
      required: true,
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
      description: 'The due date for the task.',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The priority of the task.',
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
    const { project_id, task_list_id, content, responsible_person_id, dueDate, priority } = propsValue;

    const taskData = {
      content: content,
      'responsible-party-id': responsible_person_id,
      'due-date': dueDate,
      priority: priority,
    };
    
    if (task_list_id) {
      return await teamworkClient.createTaskInTaskList(auth as TeamworkAuth, task_list_id as string, taskData);
    } else {
      return await teamworkClient.createTaskInProject(auth as TeamworkAuth, project_id as string, taskData);
    }
  },
});
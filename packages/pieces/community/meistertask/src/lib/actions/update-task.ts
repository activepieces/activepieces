import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import {
  personDropdown,
  projectDropdown,
  sectionDropdown,
  taskDropdown,
} from '../common/props';
import { meisterTaskApiService } from '../common/requests';

export const updateTask = createAction({
  auth: meisterTaskAuth,
  name: 'updateTask',
  displayName: 'Update Task',
  description: 'Updates an existing task',
  props: {
    projectId: projectDropdown({
      displayName: 'Select Project',
      description: 'Select a project',
      required: true,
    }),
    taskId: taskDropdown({
      displayName: 'Select Task',
      description: 'Select a task',
      required: true,
    }),
    sectionId: sectionDropdown({
      displayName: 'Select section',
      description: 'Select a section',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the task.',
      required: true,
    }),
    personId: personDropdown({
      displayName: 'Select a person',
      description: 'The person to whom the task is assigned',
      required: true,
    }),
    due: Property.DateTime({
      displayName: 'Task Due Date',
      description: 'The due date and time of the task.',
      required: true,
    }),
    notes: Property.ShortText({
      displayName: 'Task Description',
      description: 'The description of the task.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '',
      required: false,
      options: {
        options: [
          {
            label: 'Open',
            value: '1',
          },
          {
            label: 'Completed',
            value: '2',
          },
          {
            label: 'Trashed',
            value: '8',
          },
          {
            label: 'Completed Archive',
            value: '18',
          },
        ],
      },
    }),
  },
  async run(context) {
    return await meisterTaskApiService.updateTask({
      auth: context.auth,
      taskId: context.propsValue.taskId,
      payload: {
        name: context.propsValue.name,
        assigned_to_id: context.propsValue.personId,
        due: context.propsValue.due,
        notes: context.propsValue.notes,
        status: context.propsValue.status,
        section_id: context.propsValue.sectionId,
      },
    });
  },
});

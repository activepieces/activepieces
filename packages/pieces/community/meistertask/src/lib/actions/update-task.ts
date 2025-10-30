import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { apiRequest } from '../api';
import { projectDropdown, taskDropdown, personDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

const getUpdateTaskFields = (): DynamicPropsValue => {
  return {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'New name for the task',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'New notes for the task',
      required: false,
    }),
    assigned_to_id: personDropdown,
    due: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date for the task',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Task status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Open', value: 1 },
          { label: 'Completed', value: 2 },
          { label: 'Trashed', value: 18 },
        ],
      },
    }),
  };
};

export const updateTaskAction = createAction({
  auth: meisterTaskAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Updates an existing task in MeisterTask',
  props: {
    project_id: projectDropdown,
    task_id: taskDropdown,
    taskFields: Property.DynamicProperties({
      displayName: 'Task Updates',
      description: 'Fields to update',
      required: true,
      refreshers: [],
      props: async () => getUpdateTaskFields(),
    }),
  },
  async run({ auth, propsValue }) {
    const { task_id, taskFields } = propsValue;
    
    if (!taskFields || typeof taskFields !== 'object') {
      throw new Error('Task fields are required');
    }

    const { name, notes, assigned_to_id, due, status } = taskFields as any;

    const body: any = {};
    
    if (name && typeof name === 'string' && name.trim().length > 0) {
      body.name = name.trim();
    }
    if (notes && typeof notes === 'string' && notes.trim().length > 0) {
      body.notes = notes.trim();
    }
    if (assigned_to_id) {
      body.assigned_to_id = assigned_to_id;
    }
    if (due) {
      body.due = due;
    }
    if (status) {
      body.status = status;
    }

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided to update the task');
    }

    const result = await apiRequest<any>(auth, HttpMethod.PUT, `/tasks/${task_id}`, body);
    return result;
  },
});

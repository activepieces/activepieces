import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { apiRequest } from '../api';
import { projectDropdown, sectionDropdown, personDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

const getTaskFields = (): DynamicPropsValue => {
  return {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'Name of the task',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Task description or notes',
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
      defaultValue: 1,
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

export const createTaskAction = createAction({
  auth: meisterTaskAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a new task in MeisterTask',
  props: {
    project_id: projectDropdown,
    section_id: sectionDropdown,
    taskFields: Property.DynamicProperties({
      displayName: 'Task Details',
      description: 'Task information',
      required: true,
      refreshers: [],
      props: async () => getTaskFields(),
    }),
  },
  async run({ auth, propsValue }) {
    const { section_id, taskFields } = propsValue;
    
    if (!taskFields || typeof taskFields !== 'object') {
      throw new Error('Task fields are required');
    }

    const { name, notes, assigned_to_id, due, status } = taskFields as any;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Task name is required and cannot be empty');
    }

    const body: any = { name: name.trim() };
    
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

    const result = await apiRequest<any>(auth, HttpMethod.POST, `/sections/${section_id}/tasks`, body);
    return result;
  },
});

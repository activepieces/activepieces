import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import {
  multiLabelDropdown,
  personDropdown,
  projectDropdown,
  sectionDropdown,
} from '../common/props';
import { meisterTaskApiService } from '../common/requests';

export const createTask = createAction({
  auth: meisterTaskAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Creates a new task',
  props: {
    projectId: projectDropdown({
      displayName: 'Select Project',
      description: 'Select a project',
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
      required: false,
    }),
    due: Property.DateTime({
      displayName: 'Task Due Date',
      description: 'The due date and time of the task.',
      required: false,
    }),
    notes: Property.ShortText({
      displayName: 'Task Description',
      description: 'The description of the task.',
      required: false,
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
    labelIds: multiLabelDropdown({
      displayName: 'Select Labels',
      description:
        'Select the labels to assign to this task. These must exist in the project.',
      required: false,
    }),
  },
  async run(context) {
    return await meisterTaskApiService.createTask({
      auth: context.auth,
      sectionId: context.propsValue.sectionId,
      payload: {
        name: context.propsValue.name,
        assigned_to_id: context.propsValue.personId,
        due: context.propsValue.due,
        notes: context.propsValue.notes,
        status: context.propsValue.status,
        label_ids: context.propsValue.labelIds,
      },
    });
  },
});

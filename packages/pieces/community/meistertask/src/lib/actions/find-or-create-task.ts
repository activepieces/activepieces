import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskApiService } from '../common/requests';
import {
  multiLabelDropdown,
  personDropdown,
  projectDropdown,
  sectionDropdown,
} from '../common/props';

export const findOrCreateTask = createAction({
  auth: meisterTaskAuth,
  name: 'findOrCreateTask',
  displayName: 'Find or Create Task',
  description: 'Finds a task by searching, or creates one if it doesn’t exist',
  props: {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the task to create/search for',
      required: true,
    }),
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
    const params = new URLSearchParams();
    params.append('items', String(1000));
    params.append('page', String(1));

    const response = await meisterTaskApiService.fetchTasks({
      auth: context.auth,
      queryString: params.toString(),
    });

    const matchingItems = response.filter(
      (item: any) =>
        item.name.toLowerCase() === context.propsValue.name.toLowerCase()
    );

    if (matchingItems.length > 0) {
      return {
        found: true,
        data: matchingItems,
        message:
          matchingItems.length === 1
            ? 'Found 1 matching task'
            : `Found ${matchingItems.length} matching tasks`,
      };
    }

    const resp = await meisterTaskApiService.createTask({
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

    return {
      found: false,
      data: resp,
      message: 'Found 0 matching tasks. Created New Task',
    };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../auth';

export const createTask = createAction({
  auth: meistertaskAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in MeisterTask',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      required: true,
    }),
    section_id: Property.ShortText({
      displayName: 'Section ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run(context) {
    const response = await fetch('https://www.meistertask.com/api/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: context.propsValue.name,
        description: context.propsValue.description,
        project_id: context.propsValue.project_id,
        section_id: context.propsValue.section_id,
      }),
    });
    return await response.json();
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';

export const createTaskAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Capsule CRM',
  
  props: {
    description: Property.ShortText({
      displayName: 'Task Description',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      required: false,
    }),
  },

  async run(context) {
    const { description, dueDate, category } = context.propsValue;

    const task: any = { description };
    if (dueDate) task.dueDate = dueDate;
    if (category) task.category = category;

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/tasks',
      { task }
    );

    return response.task;
  },
});

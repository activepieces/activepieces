import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createTaskAction = createAction({
  auth: mycaseAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a new task',
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
    due_date: Property.ShortText({ displayName: 'Due Date', required: false }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createTask({ 
      title: context.propsValue.title,
      due_date: context.propsValue.due_date 
    });
  },
});


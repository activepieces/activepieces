import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getTask = createAction({
  auth: onfleetAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description: 'Get a specific task',
  props: {
    task: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task you want to delete',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.tasks.get(context.propsValue.task);
  },
});

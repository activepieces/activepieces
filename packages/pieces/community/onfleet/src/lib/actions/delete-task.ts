import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const deleteTask = createAction({
  auth: onfleetAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Deletes a task',
  props: {
    task: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task you want to delete',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.tasks.deleteOne(context.propsValue.task);
  },
});

import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const cloneTask = createAction({
  auth: onfleetAuth,
  name: 'clone_task',
  displayName: 'Clone Task',
  description: 'Clones a task',
  props: {
    task: Property.ShortText({
      displayName: 'Task ID',
      description: 'ID of the task you want to clone',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.tasks.clone(context.propsValue.task);
  },
});

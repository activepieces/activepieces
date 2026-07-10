import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const cloneTask = createAction({
  auth: onfleetAuth,
  name: 'clone_task',
  displayName: 'Clone Task',
  description: 'Clones a task',
  audience: 'both',
  aiMetadata: {
    description:
      'Duplicate an existing Onfleet task by its ID, producing a new task that copies the original. Not idempotent: every call creates an additional clone. Use to replicate a task setup rather than re-enter all details with Create Task.',
    idempotent: false,
  },
  props: {
    task: Property.ShortText({
      displayName: 'Task ID',
      description: 'ID of the task you want to clone',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.tasks.clone(context.propsValue.task);
  },
});

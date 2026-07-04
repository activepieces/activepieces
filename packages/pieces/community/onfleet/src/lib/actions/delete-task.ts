import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const deleteTask = createAction({
  auth: onfleetAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Deletes a task',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete an Onfleet task by its ID. Idempotent in effect: once the task is gone the result is the same, though deleting an already-removed task may error. Destructive and irreversible, so confirm the task ID before calling.',
    idempotent: true,
  },
  props: {
    task: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task you want to delete',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.tasks.deleteOne(context.propsValue.task);
  },
});

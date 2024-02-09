import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const completeTask = createAction({
  auth: onfleetAuth,
  name: 'complete_task',
  displayName: 'Force Complete Task',
  description: 'Force completes a task',
  props: {
    task: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task you want to complete',
      required: true,
    }),
    success: Property.Checkbox({
      displayName: 'Complete as Success',
      description: 'Whether to complete the task as a success or not',
      required: true,
      defaultValue: true,
    }),
    notes: Property.ShortText({
      displayName: 'Notes',
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.tasks.forceComplete(context.propsValue.task, {
      completionDetails: {
        success: context.propsValue.success,
        notes: context.propsValue.notes,
      },
    });
  },
});

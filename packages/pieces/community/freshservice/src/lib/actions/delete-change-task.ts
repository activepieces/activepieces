import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const deleteChangeTask = createAction({
  auth: freshserviceAuth,
  name: 'delete_change_task',
  displayName: 'Delete Change Task',
  description: 'Deletes a task from a change request in Freshservice.',
  props: {
    change_id: freshserviceCommon.change(true),
    task_id: Property.Number({
      displayName: 'Task ID',
      description: 'The ID of the task to delete.',
      required: true,
    }),
  },
  async run(context) {
    await freshserviceApiCall({
      method: HttpMethod.DELETE,
      endpoint: `changes/${context.propsValue.change_id}/tasks/${context.propsValue.task_id}`,
      auth: context.auth,
    });

    return { success: true };
  },
});

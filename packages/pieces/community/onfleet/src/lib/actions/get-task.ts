import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getTask = createAction({
  auth: onfleetAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description: 'Get a specific task',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single Onfleet task by its task ID. Read-only and idempotent. Use when you already have the task ID; use Get Tasks to search or list tasks over a time window.',
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

    return await onfleetApi.tasks.get(context.propsValue.task);
  },
});

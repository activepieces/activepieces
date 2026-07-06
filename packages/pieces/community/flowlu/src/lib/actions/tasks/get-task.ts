import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';

export const getTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_get_task',
  displayName: 'Get Task',
  description: 'Retrieves an existing task.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single task from Flowlu by its task id. Use to look up a task\'s current details before acting on it. Read-only and idempotent.', idempotent: true },
  props: {
    task_id: flowluCommon.task_id(true),
  },
  async run(context) {
    const task_id = context.propsValue.task_id!;
    const client = makeClient(
      context.auth
    );
    return await client.getTask(task_id);
  },
});

import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../..';
import { flowluCommon, makeClient } from '../../common';

export const getTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_get_task',
  displayName: 'Get Task',
  description: 'Retrieves an existing task.',
  props: {
    task_id: flowluCommon.task_id(true),
  },
  async run(context) {
    const task_id = context.propsValue.task_id!;
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.getTask(task_id);
  },
});

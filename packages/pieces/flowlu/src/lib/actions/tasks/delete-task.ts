import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../..';
import { flowluCommon, makeClient } from '../../common';

export const deleteTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_delete_task',
  displayName: 'Delete Task',
  description: 'Deletes an existing task.',
  props: {
    task_id: flowluCommon.task_id(true),
  },
  async run(context) {
    const task_id = context.propsValue.task_id!;
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.deleteTask(task_id);
  },
});

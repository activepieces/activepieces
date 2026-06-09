import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { FlowluEntity, FlowluModule } from '../../common/constants';

export const deleteTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_delete_task',
  displayName: 'Delete Task',
  description: 'Deletes an existing task.',
  audience: 'both',
  aiMetadata: { description: 'Deletes a task in Flowlu by its task id. Use to permanently remove a task. Effectively idempotent in end state once removed, but it mutates data and a repeat call targets an already-deleted record.', idempotent: false },
  props: {
    task_id: flowluCommon.task_id(true),
  },
  async run(context) {
    const task_id = context.propsValue.task_id!;
    const client = makeClient(
      context.auth
    );
    return await client.deleteAction(
      FlowluModule.TASK,
      FlowluEntity.TASKS,
      task_id
    );
  },
});

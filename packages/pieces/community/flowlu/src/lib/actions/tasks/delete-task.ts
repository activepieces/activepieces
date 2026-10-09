import { createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { FlowluEntity, FlowluModule } from '../../common/constants';
import { deletedEnvelopeOutputSchema } from '../../output-schemas';

export const deleteTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_delete_task',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Task',
  description: 'Deletes an existing task.',
  audience: 'human',
  aiMetadata: {
    description:
      'Deletes a task in Flowlu by its task id. Use to permanently remove a task. Effectively idempotent in end state once removed, but it mutates data and a repeat call targets an already-deleted record. For agents use flowlu_task_delete.',
    idempotent: false,
  },
  props: {
    task_id: flowluCommon.task_id(true),
  },
  outputSchema: deletedEnvelopeOutputSchema,
  async run(context) {
    const task_id = flowluInput.requireId({
      value: context.propsValue.task_id,
      name: 'Task ID',
    });
    const client = makeClient(context.auth);
    return await client.deleteAction(
      FlowluModule.TASK,
      FlowluEntity.TASKS,
      task_id
    );
  },
});

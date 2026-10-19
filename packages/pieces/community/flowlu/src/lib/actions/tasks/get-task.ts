import { createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { taskEnvelopeOutputSchema } from '../../output-schemas';

export const getTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_get_task',
  classification: 'READ',
  displayName: 'Get Task',
  description: 'Retrieves an existing task.',
  audience: 'human',
  aiMetadata: {
    description:
      "Retrieves a single task from Flowlu by its task id. Use to look up a task's current details before acting on it. Read-only and idempotent. For agents use flowlu_task_get.",
    idempotent: true,
  },
  props: {
    task_id: flowluCommon.task_id(true),
  },
  outputSchema: taskEnvelopeOutputSchema,
  async run(context) {
    const task_id = flowluInput.requireId({
      value: context.propsValue.task_id,
      name: 'Task ID',
    });
    const client = makeClient(context.auth);
    return await client.getTask(task_id);
  },
});

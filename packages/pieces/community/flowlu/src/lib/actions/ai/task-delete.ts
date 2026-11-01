import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { deletedOutputSchema } from '../../output-schemas';

export const flowluTaskDelete = createAction({
  auth: flowluAuth,
  name: 'flowlu_task_delete',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Task',
  description: 'Deletes a Flowlu task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Flowlu task by its numeric task_id. Use only when the task should be removed; to close it instead, set status 5 with flowlu_task_update. Not idempotent: a second call fails because the task no longer exists.',
    idempotent: false,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'Numeric ID of the task to delete, such as "42".',
      required: true,
    }),
  },
  outputSchema: deletedOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.task_id,
      name: 'Task ID',
    });
    const res = await makeClient(context.auth).deleteRecord(
      'task',
      'tasks',
      id
    );
    return { id: Number(res.id ?? id), deleted: true };
  },
});

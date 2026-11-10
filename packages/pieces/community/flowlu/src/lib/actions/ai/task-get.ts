import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { taskOutputSchema } from '../../output-schemas';

export const flowluTaskGet = createAction({
  auth: flowluAuth,
  name: 'flowlu_task_get',
  classification: 'READ',
  displayName: 'Get Task',
  description: 'Gets a Flowlu task by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Flowlu task (name, status, dates, assignee, workflow, linked project or account) by its numeric task_id. Use to read a task before updating it; use flowlu_find_tasks to look tasks up by name or filter. Fails if the task does not exist. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'Numeric task ID, such as "42". Get it from flowlu_find_tasks.',
      required: true,
    }),
  },
  outputSchema: taskOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.task_id,
      name: 'Task ID',
    });
    return makeClient(context.auth).getRecord('task', 'tasks', id);
  },
});

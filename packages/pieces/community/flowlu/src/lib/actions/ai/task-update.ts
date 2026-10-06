import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluAiBody, flowluAiProps } from '../../common/ai-props';
import { FlowluApiError } from '../../common/client';
import { flowluInput } from '../../common/utils';
import { taskOutputSchema } from '../../output-schemas';

export const flowluTaskUpdate = createAction({
  auth: flowluAuth,
  name: 'flowlu_task_update',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Updates fields on a Flowlu task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes only the fields you pass on one Flowlu task, identified by task_id; omitted fields keep their current value. Use to rename, reschedule, reassign, move to another workflow status, or complete a task (status 5). Requires at least one field to change. Idempotent: repeating the same update leaves the task in the same state.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'Numeric ID of the task to update, such as "42". Get it from flowlu_find_tasks.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New task name.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'New task status. Completed closes the task.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'New', value: 1 },
          { label: 'In progress', value: 3 },
          { label: 'Pending owner approval', value: 4 },
          { label: 'Completed', value: 5 },
        ],
      },
    }),
    ...flowluAiProps.task(),
  },
  outputSchema: taskOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.task_id,
      name: 'Task ID',
    });
    const body = flowluAiBody.task(context.propsValue);
    if (Object.keys(body).length === 0) {
      throw new FlowluApiError({
        message: 'Nothing to update: pass at least one field to change.',
      });
    }
    return makeClient(context.auth).updateRecord('task', 'tasks', id, body);
  },
});

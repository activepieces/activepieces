import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyOps } from '../common/operations';
import { taskOutputSchema } from '../output-schemas';

export const getTask = createAction({
  auth: niftyAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description: 'Get a task by its ID.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Nifty task by ID with its status, milestone/list, parent task, dates, completion, assignee IDs and subtask counts. Use after a trigger or search to read current details before updating. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The task ID, e.g. from a trigger or Find Tasks (not the short key like ANP-1).',
      required: true,
    }),
  },
  outputSchema: taskOutputSchema,
  async run(context) {
    return niftyOps.getTask({ auth: context.auth, taskId: context.propsValue.task_id });
  },
});

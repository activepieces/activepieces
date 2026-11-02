import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { niftyOps } from '../common/operations';
import { taskOutputSchema } from '../output-schemas';

export const completeTask = createAction({
  auth: niftyAuth,
  name: 'complete_task',
  displayName: 'Complete or Reopen Task',
  description: 'Mark a task as complete, or reopen a completed task.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks a Nifty task complete or reopens it, picked from cascading project and task dropdowns (agents: use nifty_task_update with completion). Idempotent: completing an already completed task leaves it completed.',
    idempotent: true,
  },
  props: {
    portfolio: niftyProps.portfolio({ required: false }),
    project: niftyProps.project({ required: true }),
    task: niftyProps.task({ required: true }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      required: true,
      defaultValue: 'complete',
      options: {
        options: [
          { label: 'Mark complete', value: 'complete' },
          { label: 'Reopen', value: 'reopen' },
        ],
      },
    }),
  },
  outputSchema: taskOutputSchema,
  async run(context) {
    const { task, action } = context.propsValue;
    if (action !== 'complete' && action !== 'reopen') {
      throw new Error(`Action must be "complete" or "reopen", got "${String(action)}".`);
    }
    return niftyOps.setTaskCompletion({ auth: context.auth, taskId: task, completed: action === 'complete' });
  },
});

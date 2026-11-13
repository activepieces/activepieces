import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { niftyOps } from '../common/operations';
import { deleteTaskOutputSchema } from '../output-schemas';

export const deleteTask = createAction({
  auth: niftyAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Permanently delete a task.',
  audience: 'human',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Nifty task picked from project and task dropdowns; it cannot be undone. Prefer Complete or Reopen Task when the work should stay on record. Idempotent in end state: a repeat call fails with not found because the task is already gone.',
    idempotent: true,
  },
  props: {
    warning: Property.MarkDown({
      value: 'Deleting a task is permanent and cannot be undone in Nifty.',
    }),
    portfolio: niftyProps.portfolio({ required: false }),
    project: niftyProps.project({ required: true }),
    task: niftyProps.task({ required: true }),
  },
  outputSchema: deleteTaskOutputSchema,
  async run(context) {
    return niftyOps.deleteTask({ auth: context.auth, taskId: context.propsValue.task });
  },
});

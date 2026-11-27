import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUpdateTaskOutputSchema } from '../../../output-schemas';

const ACTIONS = ['review', 'complete'];
const COMPLETION_RULES = ['all_assignees', 'any_assignee'];

export const updateTaskAction = createAction({
  auth: boxAuth,
  name: 'box_update_task',
  outputSchema: boxUpdateTaskOutputSchema,
  displayName: 'Update Task',
  description: 'Changes a task on a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a task\'s action, message, due date or completion rule; only the fields given change. To change who it is assigned to use Assign Task and Delete Task Assignment. Get the ID from List File Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: boxAiProps.taskId({ required: true }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: '"review" (approve/reject) or "complete" (mark done).',
      required: false,
      options: { options: ACTIONS.map((value) => ({ label: value, value })) },
    }),
    message: Property.LongText({ displayName: 'Message', description: 'New instructions for the assignees.', required: false }),
    dueAt: Property.DateTime({ displayName: 'Due At', description: 'New due date, ISO 8601.', required: false }),
    completionRule: Property.StaticDropdown({
      displayName: 'Completion Rule',
      description: '"all_assignees" or "any_assignee".',
      required: false,
      options: { options: COMPLETION_RULES.map((value) => ({ label: value, value })) },
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.action !== undefined && !ACTIONS.includes(propsValue.action)) {
      throw new Error(`Action must be one of: ${ACTIONS.join(', ')}.`);
    }
    if (propsValue.completionRule !== undefined && !COMPLETION_RULES.includes(propsValue.completionRule)) {
      throw new Error(`Completion Rule must be one of: ${COMPLETION_RULES.join(', ')}.`);
    }
    const body = {
      ...(propsValue.action !== undefined ? { action: propsValue.action } : {}),
      ...(propsValue.message !== undefined ? { message: propsValue.message } : {}),
      ...(propsValue.dueAt !== undefined ? { due_at: propsValue.dueAt } : {}),
      ...(propsValue.completionRule !== undefined ? { completion_rule: propsValue.completionRule } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/tasks/${encodeURIComponent(propsValue.taskId)}`,
      body,
    });
  },
});

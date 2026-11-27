import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const ACTIONS = ['review', 'complete'];
const COMPLETION_RULES = ['all_assignees', 'any_assignee'];

export const createTaskAction = createAction({
  auth: boxAuth,
  name: 'box_create_task',
  displayName: 'Create Task',
  description: 'Creates a task on a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a review or completion task on a file and returns its ID. The task has no assignees yet: add them with Assign Task.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: '"review" (approve/reject) or "complete" (mark done). Defaults to "review".',
      required: false,
      options: { options: ACTIONS.map((value) => ({ label: value, value })) },
    }),
    message: Property.LongText({ displayName: 'Message', description: 'Instructions for the assignees.', required: false }),
    dueAt: Property.DateTime({ displayName: 'Due At', description: 'When the task is due, ISO 8601.', required: false }),
    completionRule: Property.StaticDropdown({
      displayName: 'Completion Rule',
      description: '"all_assignees" (default) or "any_assignee".',
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
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/tasks',
      body: {
        item: { id: propsValue.fileId, type: 'file' },
        ...(propsValue.action !== undefined ? { action: propsValue.action } : {}),
        ...(propsValue.message !== undefined ? { message: propsValue.message } : {}),
        ...(propsValue.dueAt !== undefined ? { due_at: propsValue.dueAt } : {}),
        ...(propsValue.completionRule !== undefined ? { completion_rule: propsValue.completionRule } : {}),
      },
    });
  },
});

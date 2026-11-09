import { Property, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloProps } from '../common/props';
import { apolloMappers, apolloRequests } from '../common/requests';

export const createTaskAction = createAction({
  auth: apolloAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a task for a contact in Apollo, assigned to a user.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a scheduled Apollo task (call, manual email, LinkedIn step or action item) for one contact, assigned to a user and due at a date and time. Every run creates a new task. Uses no credits.',
    idempotent: false,
  },
  props: {
    contact_id: apolloProps.contact({ required: true, description: 'Contact the task is about. Type a name or email to search, or map a contact ID.' }),
    user_id: apolloProps.owner({ displayName: 'Assignee', description: 'Apollo user who does the task.', required: true }),
    type: apolloProps.taskType(),
    due_at: Property.DateTime({ displayName: 'Due At', required: true }),
    priority: apolloProps.taskPriority(),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    note: Property.LongText({ displayName: 'Note', required: false }),
  },
  outputSchema: apolloOutputSchemas.humanTask,
  async run({ propsValue, auth }) {
    const dueAt = apolloInputs.requireText({ value: propsValue.due_at, label: 'Due At' });
    const dueMs = Date.parse(dueAt);
    if (Number.isNaN(dueMs)) {
      throw new Error(`Due At is not a valid date and time (got "${dueAt.slice(0, 40)}").`);
    }
    const body = apolloInputs.compact({
      contact_id: apolloInputs.requireText({ value: propsValue.contact_id, label: 'Contact' }),
      user_id: apolloInputs.requireText({ value: propsValue.user_id, label: 'Assignee' }),
      type: apolloInputs.requireText({ value: propsValue.type, label: 'Task Type' }),
      status: 'scheduled',
      due_at: new Date(dueMs).toISOString(),
      priority: apolloInputs.optionalText(propsValue.priority),
      title: apolloInputs.optionalText(propsValue.title),
      note: apolloInputs.optionalText(propsValue.note),
    });
    const response = await apolloRequests.createTask({ apiKey: apiKeyOf(auth), body });
    return { task: apolloMappers.task(response['task']) };
  },
});

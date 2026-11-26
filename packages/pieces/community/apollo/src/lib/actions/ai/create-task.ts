import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiCreateTaskAction = createAction({
  auth: apolloAuth,
  name: 'ai_create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a task for a contact.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a scheduled Apollo task (call, manual email, LinkedIn step or action item) about one saved contact, assigned to a user and due at an ISO 8601 date-time with time zone. Every call creates a new task, so a retry duplicates it. Uses no credits.',
    idempotent: false,
  },
  props: {
    contact_id: aiProps.id({ displayName: 'Contact ID', description: 'Contact ID from Search Contacts (field id).' }),
    user_id: aiProps.id({ displayName: 'Assignee User ID', description: 'User ID from List Users (field id) or Get Credit Usage (field user_id).' }),
    type: aiProps.choice({
      displayName: 'Task Type',
      description: 'Kind of task.',
      required: true,
      options: [
        { label: 'Call', value: 'call' },
        { label: 'Manual email', value: 'outreach_manual_email' },
        { label: 'LinkedIn connect', value: 'linkedin_step_connect' },
        { label: 'LinkedIn message', value: 'linkedin_step_message' },
        { label: 'LinkedIn view profile', value: 'linkedin_step_view_profile' },
        { label: 'LinkedIn interact with post', value: 'linkedin_step_interact_post' },
        { label: 'Action item', value: 'action_item' },
      ],
    }),
    due_at: aiProps.text({ displayName: 'Due At', description: 'ISO 8601 date-time with time zone, e.g. 2026-11-20T15:00:00Z.', required: true }),
    priority: aiProps.choice({
      displayName: 'Priority',
      description: 'high, medium or low.',
      required: false,
      options: [
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
    }),
    title: aiProps.text({ displayName: 'Title', description: 'Short task title.', required: false }),
    note: aiProps.text({ displayName: 'Note', description: 'Task note.', required: false }),
  },
  outputSchema: apolloOutputSchemas.task,
  async run({ propsValue, auth }) {
    const body = apolloInputs.compact({
      contact_id: apolloInputs.requireText({ value: propsValue.contact_id, label: 'Contact ID' }),
      user_id: apolloInputs.requireText({ value: propsValue.user_id, label: 'Assignee User ID' }),
      type: apolloInputs.requireText({ value: propsValue.type, label: 'Task Type' }),
      status: 'scheduled',
      due_at: apolloInputs.isoDateTime({ value: propsValue.due_at, label: 'Due At' }),
      priority: apolloInputs.optionalText(propsValue.priority),
      title: apolloInputs.optionalText(propsValue.title),
      note: apolloInputs.optionalText(propsValue.note),
    });
    const response = await apolloRequests.createTask({ apiKey: apiKeyOf(auth), body });
    return { task: apolloMappers.task(response['task']) };
  },
});

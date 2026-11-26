import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { taskOutputSchema } from '../../common/output-schemas';
import { CreateTaskParams } from '../../common/types';

export const aiCreateTask = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a task.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a Capsule CRM task (to-do) with a due date and returns it with its id. Link it to at most one record by giving one of Party ID, Opportunity ID or Project ID; giving more than one is rejected. Owner defaults to the connected user. Not idempotent: each call creates another task.',
    idempotent: false,
  },
  outputSchema: taskOutputSchema,
  props: {
    description: Property.ShortText({ displayName: 'Description', description: 'Short task title.', required: true }),
    due_on: Property.ShortText({ displayName: 'Due Date', description: 'YYYY-MM-DD.', required: true }),
    due_time: Property.ShortText({ displayName: 'Due Time', description: 'HH:MM or HH:MM:SS in the owner time zone. Leave empty for an all-day task.', required: false }),
    detail: Property.LongText({ displayName: 'Detail', description: 'Longer notes.', required: false }),
    party_id: Property.ShortText({ displayName: 'Party ID', description: 'Numeric ID of a person or organisation to link.', required: false }),
    opportunity_id: Property.ShortText({ displayName: 'Opportunity ID', description: 'Numeric ID of an opportunity to link.', required: false }),
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'Numeric ID of a project to link.', required: false }),
    owner_id: Property.ShortText({ displayName: 'Owner User ID', description: 'Numeric user ID from List Users.', required: false }),
    category_id: Property.ShortText({ displayName: 'Category ID', description: 'Optional numeric task category ID. Categories are managed in Capsule settings; there is no tool to list them, so leave empty unless you know the ID.', required: false }),
  },
  async run({ auth, propsValue }) {
    const dueOn = capsuleCrmClient.isoDate({ value: propsValue.due_on, label: 'Due Date' });
    if (dueOn === undefined) {
      throw new Error('Due Date is required (YYYY-MM-DD).');
    }
    const dueTime = capsuleCrmClient.optionalText(propsValue.due_time);
    if (dueTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(dueTime)) {
      throw new Error('Due Time must be HH:MM or HH:MM:SS in 24-hour time, for example 09:30.');
    }
    const link = capsuleCrmClient.exactlyOneLink({ partyId: propsValue.party_id, opportunityId: propsValue.opportunity_id, projectId: propsValue.project_id, required: false });
    const params: CreateTaskParams = {
      description: capsuleCrmClient.requiredText({ value: propsValue.description, label: 'Description' }),
      dueOn,
      dueTime: dueTime === undefined ? undefined : dueTime.length === 5 ? `${dueTime}:00` : dueTime,
      detail: capsuleCrmClient.optionalText(propsValue.detail),
    };
    if (link) params[link.key] = { id: link.id };
    const ownerId = capsuleCrmClient.optionalId(propsValue.owner_id);
    if (ownerId !== undefined) params.owner = { id: ownerId };
    const categoryId = capsuleCrmClient.optionalId(propsValue.category_id);
    if (categoryId !== undefined) params.category = { id: categoryId };
    return capsuleCrmClient.createTask({ auth, params });
  },
});

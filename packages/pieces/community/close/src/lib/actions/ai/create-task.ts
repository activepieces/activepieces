import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const createTask = createAction({
  auth: closeAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a to-do task on a lead.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a Close to-do task on a lead (lead_...). Assignee (user_...) defaults to the API key user. Due date is a date (YYYY-MM-DD) or an ISO 8601 date-time; omit it for a task due today. Each call creates a new task.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.task,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', description: 'lead_...', required: true }),
    text: Property.LongText({ displayName: 'Text', required: true }),
    assignedTo: Property.ShortText({ displayName: 'Assigned To (user ID)', description: 'user_...', required: false }),
    date: Property.ShortText({ displayName: 'Due', description: 'YYYY-MM-DD or ISO 8601 date-time.', required: false }),
    isComplete: Property.Checkbox({ displayName: 'Complete', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = {
      _type: 'lead',
      lead_id: closeClient.closeId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' }),
      text: closeClient.requiredText({ value: propsValue.text, label: 'Text' }),
      assigned_to: closeClient.optionalCloseId({ value: propsValue.assignedTo, label: 'Assigned To', prefix: 'user' }),
      date: closeClient.isoDate({ value: propsValue.date, label: 'Due' }),
      is_complete: closeClient.parseBoolean({ value: propsValue.isComplete, label: 'Complete' }),
    };
    const raw = await closeClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/task/',
      body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
    });
    return closeMappers.task(raw);
  },
});

export { createTask };

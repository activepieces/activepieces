import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { freshserviceApiCall, pickFields } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

const TICKET_FIELDS = ['subject', 'description', 'status', 'priority', 'urgency', 'impact', 'type', 'requester_id', 'responder_id', 'group_id', 'department_id', 'category', 'sub_category', 'due_by', 'tags', 'custom_fields'];

export const aiUpdateTicket = createAction({
  auth: freshserviceAuth,
  name: 'ai_update_ticket',
  displayName: 'Update Ticket (AI)',
  description: 'Updates fields on an existing Freshservice ticket.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.ticket,
  aiMetadata: {
    description:
      'Updates an existing Freshservice ticket by numeric ticket id. Only the fields you pass are changed; leave the rest empty. Use it to change status (2 Open, 3 Pending, 4 Resolved, 5 Closed), priority (1-4), assignment (agent/group ids from List Agents / List Groups) or other fields. Tags, when given, replace the existing tags. Idempotent — sending the same values again leaves the ticket unchanged.',
    idempotent: true,
  },
  props: {
    ticket_id: Property.Number({ displayName: 'Ticket ID', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: Property.Number({ displayName: 'Status', description: '2 Open, 3 Pending, 4 Resolved, 5 Closed.', required: false }),
    priority: Property.Number({ displayName: 'Priority', description: '1 Low, 2 Medium, 3 High, 4 Urgent.', required: false }),
    urgency: Property.Number({ displayName: 'Urgency', description: '1 Low, 2 Medium, 3 High.', required: false }),
    impact: Property.Number({ displayName: 'Impact', description: '1 Low, 2 Medium, 3 High.', required: false }),
    type: Property.ShortText({ displayName: 'Type', required: false }),
    requester_id: Property.Number({ displayName: 'Requester ID', required: false }),
    responder_id: Property.Number({ displayName: 'Agent ID', required: false }),
    group_id: Property.Number({ displayName: 'Group ID', required: false }),
    department_id: Property.Number({ displayName: 'Department ID', required: false }),
    category: Property.ShortText({ displayName: 'Category', required: false }),
    sub_category: Property.ShortText({ displayName: 'Sub Category', required: false }),
    due_by: Property.ShortText({ displayName: 'Due By', description: 'ISO 8601 date-time.', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Replaces existing tags.', required: false }),
    custom_fields: Property.Json({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const { ticket_id } = context.propsValue;
    const body = pickFields({ source: context.propsValue, keys: TICKET_FIELDS });
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await freshserviceApiCall<{ ticket: Record<string, unknown> }>({
      method: HttpMethod.PUT,
      endpoint: `tickets/${ticket_id}`,
      auth: context.auth,
      body,
    });
    return response.body.ticket;
  },
});

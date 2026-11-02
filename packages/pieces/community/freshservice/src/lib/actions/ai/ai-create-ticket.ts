import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { compactBody, freshserviceApiCall } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiCreateTicket = createAction({
  auth: freshserviceAuth,
  name: 'ai_create_ticket',
  displayName: 'Create Ticket (AI)',
  description: 'Creates a Freshservice ticket using plain IDs or a requester email.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.ticket,
  aiMetadata: {
    description:
      'Creates a new Freshservice ticket (incident or service request). Identify the requester either by numeric requester_id (from Find Requester) or by email; an unknown email creates a new requester. Status defaults to 2 (Open) and priority to 1 (Low). Agent, group and department ids come from List Agents, List Groups and List Departments. Not idempotent — every call creates a new ticket, so do not retry after a success.',
    idempotent: false,
  },
  props: {
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Ticket body. HTML is allowed.',
      required: true,
    }),
    requester_id: Property.Number({
      displayName: 'Requester ID',
      description: 'Numeric requester id. Provide this or Email.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Requester Email',
      description: 'Requester email address. Provide this or Requester ID.',
      required: false,
    }),
    status: Property.Number({
      displayName: 'Status',
      description: '2 Open (default), 3 Pending, 4 Resolved, 5 Closed.',
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description: '1 Low (default), 2 Medium, 3 High, 4 Urgent.',
      required: false,
    }),
    urgency: Property.Number({ displayName: 'Urgency', description: '1 Low, 2 Medium, 3 High.', required: false }),
    impact: Property.Number({ displayName: 'Impact', description: '1 Low, 2 Medium, 3 High.', required: false }),
    source: Property.Number({
      displayName: 'Source',
      description: '1 Email, 2 Portal, 3 Phone, 7 Chat, 9 Feedback Widget, 10 Outbound Email.',
      required: false,
    }),
    type: Property.ShortText({ displayName: 'Type', description: 'Incident or Service Request.', required: false }),
    responder_id: Property.Number({ displayName: 'Agent ID', required: false }),
    group_id: Property.Number({ displayName: 'Group ID', required: false }),
    department_id: Property.Number({ displayName: 'Department ID', required: false }),
    category: Property.ShortText({ displayName: 'Category', required: false }),
    sub_category: Property.ShortText({ displayName: 'Sub Category', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Object of custom field API names to values.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const email = props.email?.trim();
    if ((props.requester_id === undefined || props.requester_id === null) && !email) {
      throw new Error('Provide either Requester ID or Requester Email.');
    }
    const response = await freshserviceApiCall<{ ticket: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: 'tickets',
      auth: context.auth,
      body: compactBody({
        subject: props.subject,
        description: props.description,
        requester_id: props.requester_id,
        email: props.requester_id === undefined || props.requester_id === null ? email : undefined,
        status: props.status ?? 2,
        priority: props.priority ?? 1,
        urgency: props.urgency,
        impact: props.impact,
        source: props.source,
        type: props.type,
        responder_id: props.responder_id,
        group_id: props.group_id,
        department_id: props.department_id,
        category: props.category,
        sub_category: props.sub_category,
        tags: props.tags,
        custom_fields: props.custom_fields,
      }),
    });
    return response.body.ticket;
  },
});

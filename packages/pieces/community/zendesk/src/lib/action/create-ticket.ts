import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const createTicket = createAction({
  auth: zendeskAuth,
  name: 'create_ticket',
  displayName: 'Create Ticket',
  description: 'Create a new ticket in Zendesk',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the ticket',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the ticket',
      required: true,
    }),
    requester_id: Property.ShortText({
      displayName: 'Requester ID',
      description: 'The ID of the user requesting the ticket',
      required: false,
    }),
    requester_email: Property.ShortText({
      displayName: 'Requester Email',
      description: 'The email of the user requesting the ticket (if no requester_id)',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The priority of the ticket',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'The type of the ticket',
      required: false,
      options: {
        options: [
          { label: 'Question', value: 'question' },
          { label: 'Incident', value: 'incident' },
          { label: 'Problem', value: 'problem' },
          { label: 'Task', value: 'task' },
        ],
      },
    }),
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The ID of the organization for this ticket',
      required: false,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'The ID of the agent assigned to this ticket',
      required: false,
    }),
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description: 'The ID of the group for this ticket',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the ticket',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom fields for the ticket (JSON format)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    const ticketData: { ticket: Record<string, unknown> } = {
      ticket: {
        subject: propsValue.subject,
        comment: {
          body: propsValue.description,
        },
      },
    };

    // Add optional fields if provided
    if (propsValue.requester_id) {
      ticketData.ticket.requester_id = parseInt(propsValue.requester_id);
    } else if (propsValue.requester_email) {
      ticketData.ticket.requester_email = propsValue.requester_email;
    }

    if (propsValue.priority) {
      ticketData.ticket.priority = propsValue.priority;
    }

    if (propsValue.type) {
      ticketData.ticket.type = propsValue.type;
    }

    if (propsValue.organization_id) {
      ticketData.ticket.organization_id = parseInt(propsValue.organization_id);
    }

    if (propsValue.assignee_id) {
      ticketData.ticket.assignee_id = parseInt(propsValue.assignee_id);
    }

    if (propsValue.group_id) {
      ticketData.ticket.group_id = parseInt(propsValue.group_id);
    }

    if (propsValue.tags && propsValue.tags.length > 0) {
      ticketData.ticket.tags = propsValue.tags;
    }

    if (propsValue.custom_fields) {
      ticketData.ticket.custom_fields = propsValue.custom_fields;
    }

    const response = await httpClient.sendRequest<{ ticket: Record<string, unknown> }>({
      url: `https://${subdomain}.zendesk.com/api/v2/tickets.json`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      body: ticketData,
    });

    return response.body;
  },
}); 
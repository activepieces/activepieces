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

export const updateTicket = createAction({
  auth: zendeskAuth,
  name: 'update_ticket',
  displayName: 'Update Ticket',
  description: 'Modify ticket fields or status via API call',
  props: {
    ticket_id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to update',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The new subject of the ticket',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new description of the ticket',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The new status of the ticket',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Solved', value: 'solved' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The new priority of the ticket',
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
      description: 'The new type of the ticket',
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
      description: 'The new organization ID for this ticket',
      required: false,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'The new assignee ID for this ticket',
      required: false,
    }),
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description: 'The new group ID for this ticket',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'New tags to apply to the ticket',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'New custom fields for the ticket (JSON format)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    const ticketData: { ticket: Record<string, unknown> } = {
      ticket: {},
    };

    // Add optional fields if provided
    if (propsValue.subject) {
      ticketData.ticket.subject = propsValue.subject;
    }

    if (propsValue.description) {
      ticketData.ticket.comment = {
        body: propsValue.description,
      };
    }

    if (propsValue.status) {
      ticketData.ticket.status = propsValue.status;
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
      url: `https://${subdomain}.zendesk.com/api/v2/tickets/${propsValue.ticket_id}.json`,
      method: HttpMethod.PUT,
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
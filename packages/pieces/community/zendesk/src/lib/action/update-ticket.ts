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
  description: 'Modify ticket fields or status via API call. Only agents can update tickets. Note: This endpoint has specific rate limits (30 updates per 10 minutes per user+ticket).',
  props: {
    ticket_id: Property.Dropdown({
      displayName: 'Ticket',
      description: 'Select a ticket to update',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }

        try {
          const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };
          
          // Fetch tickets from Zendesk API
          const response = await httpClient.sendRequest<{ tickets: Array<{ id: number; subject: string; status: string; requester_id?: number }> }>({
            url: `https://${subdomain}.zendesk.com/api/v2/tickets.json?per_page=100`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BASIC,
              username: email + '/token',
              password: token,
            },
            timeout: 30000, // 30 seconds timeout
          });

          if (response.body.tickets && response.body.tickets.length > 0) {
            return {
              disabled: false,
              options: response.body.tickets.map((ticket) => ({
                label: `#${ticket.id} - ${ticket.subject} (${ticket.status})`,
                value: ticket.id.toString(),
              })),
            };
          }

          return {
            disabled: true,
            placeholder: 'No tickets found',
            options: [],
          };
        } catch (error) {
          console.error('Error fetching tickets:', error);
          return {
            disabled: true,
            placeholder: 'Error loading tickets',
            options: [],
          };
        }
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The new subject of the ticket',
      required: false,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Add a comment to the ticket',
      required: false,
    }),
    use_html: Property.Checkbox({
      displayName: 'Use HTML Content',
      description: 'Check this if the comment contains HTML content. If checked, HTML will be preserved; if unchecked, HTML will be stripped.',
      required: false,
      defaultValue: false,
    }),
    comment_public: Property.Checkbox({
      displayName: 'Public Comment',
      description: 'Whether the comment should be public (visible to requester) or private',
      required: false,
      defaultValue: true,
    }),
    author_id: Property.ShortText({
      displayName: 'Comment Author ID',
      description: 'The ID of the user who wrote the comment (optional)',
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
    custom_status_id: Property.Number({
      displayName: 'Custom Status ID',
      description: 'The ID of a custom status for the ticket',
      required: false,
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

    if (propsValue.comment) {
      const commentData: Record<string, unknown> = {
        [propsValue.use_html ? 'html_body' : 'body']: propsValue.comment,
        public: propsValue.comment_public,
      };

      if (propsValue.author_id) {
        commentData.author_id = parseInt(propsValue.author_id);
      }

      ticketData.ticket.comment = commentData;
    }

    if (propsValue.status) {
      ticketData.ticket.status = propsValue.status;
    }

    if (propsValue.custom_status_id) {
      ticketData.ticket.custom_status_id = propsValue.custom_status_id;
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
      timeout: 30000, // 30 seconds timeout
    });

    return response.body;
  },
}); 
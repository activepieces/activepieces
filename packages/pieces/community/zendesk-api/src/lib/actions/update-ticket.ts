import {
  Property,
  createAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskApiAuth } from '../..';

export const updateTicket = createAction({
  auth: zendeskApiAuth,
  name: 'update_ticket',
  displayName: 'Update Ticket',
  description: 'Modify ticket fields or status via API call',
  props: {
    ticket_id: Property.Number({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to update',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the ticket',
      required: false,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Add a comment to the ticket',
      required: false,
    }),
    comment_public: Property.Checkbox({
      displayName: 'Public Comment',
      description: 'Whether the comment should be public (true) or private (false)',
      required: false,
      defaultValue: true,
    }),
    priority: Property.Dropdown({
      displayName: 'Priority',
      description: 'The priority level of the ticket',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
    }),
    status: Property.Dropdown({
      displayName: 'Status',
      description: 'The status of the ticket',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Solved', value: 'solved' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    type: Property.Dropdown({
      displayName: 'Type',
      description: 'The type of ticket',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Question', value: 'question' },
          { label: 'Incident', value: 'incident' },
          { label: 'Problem', value: 'problem' },
          { label: 'Task', value: 'task' },
        ],
      },
    }),
    assignee_id: Property.Number({
      displayName: 'Assignee ID',
      description: 'The ID of the user assigned to the ticket',
      required: false,
    }),
    organization_id: Property.Number({
      displayName: 'Organization ID',
      description: 'The ID of the organization this ticket belongs to',
      required: false,
    }),
    group_id: Property.Number({
      displayName: 'Group ID',
      description: 'The ID of the group this ticket belongs to',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the ticket',
      required: false,
      of: Property.ShortText({
        displayName: 'Tag',
        description: 'A tag for the ticket',
        required: true,
      }),
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'An external ID for the ticket',
      required: false,
    }),
    due_at: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the ticket is due',
      required: false,
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient',
      description: 'The recipient email address',
      required: false,
    }),
    custom_status_id: Property.Number({
      displayName: 'Custom Status ID',
      description: 'The ID of a custom status',
      required: false,
    }),
    html_body: Property.LongText({
      displayName: 'HTML Body',
      description: 'HTML content for the comment (use instead of comment for HTML)',
      required: false,
    }),
    author_id: Property.Number({
      displayName: 'Author ID',
      description: 'The ID of the user who authored the comment',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, token, subdomain } = auth as {
      email: string;
      token: string;
      subdomain: string;
    };

    const ticketData: any = {};

    // Add optional fields if provided
    if (propsValue.subject) ticketData.subject = propsValue.subject;
    if (propsValue.priority) ticketData.priority = propsValue.priority;
    if (propsValue.status) ticketData.status = propsValue.status;
    if (propsValue.type) ticketData.type = propsValue.type;
    if (propsValue.assignee_id) ticketData.assignee_id = propsValue.assignee_id;
    if (propsValue.organization_id) ticketData.organization_id = propsValue.organization_id;
    if (propsValue.group_id) ticketData.group_id = propsValue.group_id;
    if (propsValue.tags && propsValue.tags.length > 0) ticketData.tags = propsValue.tags;
    if (propsValue.external_id) ticketData.external_id = propsValue.external_id;
    if (propsValue.due_at) ticketData.due_at = propsValue.due_at;
    if (propsValue.recipient) ticketData.recipient = propsValue.recipient;
    if (propsValue.custom_status_id) ticketData.custom_status_id = propsValue.custom_status_id;

    // Handle comment if provided
    if (propsValue.comment || propsValue.html_body) {
      ticketData.comment = {};
      
      if (propsValue.comment) {
        ticketData.comment.body = propsValue.comment;
      }
      
      if (propsValue.html_body) {
        ticketData.comment.html_body = propsValue.html_body;
      }
      
      if (propsValue.comment_public !== undefined) {
        ticketData.comment.public = propsValue.comment_public;
      }
      
      if (propsValue.author_id) {
        ticketData.comment.author_id = propsValue.author_id;
      }
    }

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/tickets/${propsValue.ticket_id}.json`,
      method: HttpMethod.PUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`,
      },
      body: {
        ticket: ticketData,
      },
    });

    return response.body;
  },
}); 
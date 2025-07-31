import { zendeskAuth } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const createATicket = createAction({
  auth: zendeskAuth,
  name: 'createATicket',
  displayName: 'Create a ticket',
  description: 'Creates a new support ticket in Zendesk with specified details such as subject, description, requester, priority, and more.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: '',
      required: false,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: '',
      required: true,
    }),
    requesterEmail: Property.ShortText({
      displayName: 'Requester Email',
      description: 'Email of the requester. If not provided, the ticket will be created on behalf of the authenticated agent',
      required: false,
    }),
    requesterName: Property.ShortText({
      displayName: 'Requester Name',
      description: 'Name of the requester. Only used when creating a new requester',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: '',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
      defaultValue: 'normal',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '',
      required: false,
      options: {
        options: [
          { label: 'New', value: 'new' },
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Hold', value: 'hold' },
          { label: 'Solved', value: 'solved' },
          { label: 'Closed', value: 'closed' },
        ],
      },
      defaultValue: 'new',
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: '',
      required: false,
      options: {
        options: [
          { label: 'Problem', value: 'problem' },
          { label: 'Incident', value: 'incident' },
          { label: 'Question', value: 'question' },
          { label: 'Task', value: 'task' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: '',
      required: false,
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom fields for the ticket. Provide field IDs as keys and their values',
      required: false,
    }),
  },
  async run(context) {
    const { comment, subject, requesterEmail, requesterName, priority, status, type, tags, customFields } = context.propsValue;
    const auth = context.auth as { email: string; token: string; subdomain: string };
    
    const ticketData: Record<string, any> = {
      ticket: {
        subject,
        comment,
        priority,
        status,
        type,
      },
    };
    
    if (requesterEmail) {
      ticketData.ticket.requester = {
        email: requesterEmail,
      };
      
      if (requesterName) {
        ticketData.ticket.requester.name = requesterName;
      }
    }
    
    if (tags && Array.isArray(tags) && tags.length > 0) {
      ticketData.ticket.tags = tags;
    }
    
    if (customFields && Object.keys(customFields).length > 0) {
      ticketData.ticket.custom_fields = Object.entries(customFields).map(([id, value]) => ({
        id: Number(id),
        value,
      }));
    }
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://${auth.subdomain}.zendesk.com/api/v2/tickets`,
      body: ticketData,
      authentication: {
        type: AuthenticationType.BASIC,
        username: `${auth.email}/token`,
        password: auth.token,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 201) {
      return response.body;
    } else {
      throw new Error(`Failed to create ticket: ${response.status} ${JSON.stringify(response.body)}`);
    }
  },
});

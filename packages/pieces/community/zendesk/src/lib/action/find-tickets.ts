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

export const findTickets = createAction({
  auth: zendeskAuth,
  name: 'find_tickets',
  displayName: 'Find Ticket(s)',
  description: 'Search tickets by ID, field, or content',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search query to find tickets (e.g., "status:open", "subject:urgent", "requester:john@example.com")',
      required: false,
    }),
    ticket_id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'Specific ticket ID to retrieve (if provided, query will be ignored)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter tickets by status',
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
      description: 'Filter tickets by priority',
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
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Filter tickets by organization',
      required: false,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'Filter tickets by assignee',
      required: false,
    }),
    requester_id: Property.ShortText({
      displayName: 'Requester ID',
      description: 'Filter tickets by requester',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results to return (max 100)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    let url: string;

    if (propsValue.ticket_id) {
      // Get specific ticket by ID
      url = `https://${subdomain}.zendesk.com/api/v2/tickets/${propsValue.ticket_id}.json`;
    } else {
      // Search tickets
      url = `https://${subdomain}.zendesk.com/api/v2/search.json`;
      
      const params = new URLSearchParams();
      params.append('query', 'type:ticket');
      
      if (propsValue.query) {
        params.append('query', propsValue.query);
      }
      
      if (propsValue.status) {
        params.append('query', `status:${propsValue.status}`);
      }
      
      if (propsValue.priority) {
        params.append('query', `priority:${propsValue.priority}`);
      }
      
      if (propsValue.organization_id) {
        params.append('query', `organization_id:${propsValue.organization_id}`);
      }
      
      if (propsValue.assignee_id) {
        params.append('query', `assignee_id:${propsValue.assignee_id}`);
      }
      
      if (propsValue.requester_id) {
        params.append('query', `requester_id:${propsValue.requester_id}`);
      }
      
      if (propsValue.per_page) {
        params.append('per_page', propsValue.per_page.toString());
      }
      
      url += `?${params.toString()}`;
    }

    const response = await httpClient.sendRequest<{ tickets?: Array<Record<string, unknown>>; ticket?: Record<string, unknown>; results?: Array<Record<string, unknown>> }>({
      url,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
    });

    return response.body;
  },
}); 
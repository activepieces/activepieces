import {
  Property,
  createAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskApiAuth } from '../..';

export const findTickets = createAction({
  auth: zendeskApiAuth,
  name: 'find_tickets',
  displayName: 'Find Ticket(s)',
  description: 'Search tickets by ID, field, or content',
  props: {
    query: Property.LongText({
      displayName: 'Search Query',
      description: 'The search query (e.g., "type:ticket status:open", "assignee:john@example.com", "ticket_id:123")',
      required: true,
    }),
    sort_by: Property.Dropdown({
      displayName: 'Sort By',
      description: 'Sort results by field (defaults to relevance)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Relevance (default)', value: '' },
          { label: 'Updated At', value: 'updated_at' },
          { label: 'Created At', value: 'created_at' },
          { label: 'Priority', value: 'priority' },
          { label: 'Status', value: 'status' },
          { label: 'Ticket Type', value: 'ticket_type' },
        ],
      },
    }),
    sort_order: Property.Dropdown({
      displayName: 'Sort Order',
      description: 'Sort order (defaults to descending)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Descending (default)', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
    include_sideloads: Property.Array({
      displayName: 'Include Side-loads',
      description: 'Related records to include (e.g., users, organizations)',
      required: false,
      of: Property.Dropdown({
        displayName: 'Side-load',
        description: 'Related record type to include',
        required: true,
        options: {
          disabled: false,
          options: [
            { label: 'Users', value: 'users' },
            { label: 'Organizations', value: 'organizations' },
            { label: 'Groups', value: 'groups' },
          ],
        },
      }),
    }),
    tickets_only: Property.Checkbox({
      displayName: 'Tickets Only',
      description: 'Automatically filter to show only ticket results',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, token, subdomain } = auth as {
      email: string;
      token: string;
      subdomain: string;
    };

    // Build the query string
    let searchQuery = propsValue.query;

    // If tickets_only is enabled and the query doesn't already specify type:ticket
    if (propsValue.tickets_only && !searchQuery.toLowerCase().includes('type:ticket')) {
      searchQuery = `type:ticket ${searchQuery}`;
    }

    // Build URL parameters
    const urlParams = new URLSearchParams();
    urlParams.append('query', searchQuery);

    if (propsValue.sort_by && propsValue.sort_by !== '') {
      urlParams.append('sort_by', propsValue.sort_by);
    }

    if (propsValue.sort_order && propsValue.sort_order !== '') {
      urlParams.append('sort_order', propsValue.sort_order);
    }

    // Handle side-loads
    if (propsValue.include_sideloads && propsValue.include_sideloads.length > 0) {
      const sideloads = propsValue.include_sideloads.join(',');
      urlParams.append('include', `tickets(${sideloads})`);
    }

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/search.json?${urlParams.toString()}`,
      method: HttpMethod.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`,
      },
    });

    return response.body;
  },
});
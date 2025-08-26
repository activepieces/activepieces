import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const findTicketsAction = createAction({
  auth: zendeskAuth,
  name: 'find-tickets',
  displayName: 'Find Ticket(s)',
  description: 'Search tickets by ID, field, or content.',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Choose how to search for tickets',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Search by Ticket ID', value: 'id' },
          { label: 'Search by Status', value: 'status' },
          { label: 'Search by Priority', value: 'priority' },
          { label: 'Search by Type', value: 'type' },
          { label: 'Search by Tag', value: 'tag' },
          { label: 'Search by Requester Email', value: 'requester' },
          { label: 'Search by Assignee Email', value: 'assignee' },
          { label: 'Search by Subject/Content', value: 'content' },
          { label: 'Custom Query', value: 'custom' },
        ],
      },
    }),
    ticket_id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to find',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Search tickets by status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Hold', value: 'hold' },
          { label: 'Solved', value: 'solved' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Search tickets by priority',
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
    ticket_type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Search tickets by type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Problem', value: 'problem' },
          { label: 'Incident', value: 'incident' },
          { label: 'Question', value: 'question' },
          { label: 'Task', value: 'task' },
        ],
      },
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Search tickets containing this tag',
      required: false,
    }),
    requester_email: Property.ShortText({
      displayName: 'Requester Email',
      description: 'Search tickets by requester email address',
      required: false,
    }),
    assignee_email: Property.ShortText({
      displayName: 'Assignee Email',
      description: 'Search tickets by assignee email address',
      required: false,
    }),
    content: Property.ShortText({
      displayName: 'Content',
      description: 'Search in ticket subject and content',
      required: false,
    }),
    custom_query: Property.LongText({
      displayName: 'Custom Query',
      description: 'Custom search query using Zendesk search syntax (e.g., "type:ticket status:open priority:high")',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to sort the results',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Relevance (Default)', value: 'relevance' },
          { label: 'Created Date', value: 'created_at' },
          { label: 'Updated Date', value: 'updated_at' },
          { label: 'Priority', value: 'priority' },
          { label: 'Status', value: 'status' },
          { label: 'Ticket Type', value: 'ticket_type' },
        ],
      },
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort order for results',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Descending (Default)', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      search_type,
      ticket_id,
      status,
      priority,
      ticket_type,
      tag,
      requester_email,
      assignee_email,
      content,
      custom_query,
      sort_by,
      sort_order,
    } = propsValue;

    let query = 'type:ticket';
    
    switch (search_type) {
      case 'id':
        if (!ticket_id) {
          throw new Error('Ticket ID is required when searching by ID.');
        }
        query += ` id:${ticket_id}`;
        break;
      case 'status':
        if (!status) {
          throw new Error('Status is required when searching by status.');
        }
        query += ` status:${status}`;
        break;
      case 'priority':
        if (!priority) {
          throw new Error('Priority is required when searching by priority.');
        }
        query += ` priority:${priority}`;
        break;
      case 'type':
        if (!ticket_type) {
          throw new Error('Type is required when searching by type.');
        }
        query += ` ticket_type:${ticket_type}`;
        break;
      case 'tag':
        if (!tag) {
          throw new Error('Tag is required when searching by tag.');
        }
        query += ` tags:${tag}`;
        break;
      case 'requester':
        if (!requester_email) {
          throw new Error('Requester email is required when searching by requester.');
        }
        query += ` requester:${requester_email}`;
        break;
      case 'assignee':
        if (!assignee_email) {
          throw new Error('Assignee email is required when searching by assignee.');
        }
        query += ` assignee:${assignee_email}`;
        break;
      case 'content':
        if (!content) {
          throw new Error('Content is required when searching by content.');
        }
        query += ` ${content}`;
        break;
      case 'custom':
        if (!custom_query) {
          throw new Error('Custom query is required when using custom search.');
        }
        query = custom_query;
        break;
      default:
        throw new Error('Invalid search type selected.');
    }

    const searchParams = new URLSearchParams();
    searchParams.append('query', query);
    
    if (sort_by && sort_by !== 'relevance') {
      searchParams.append('sort_by', sort_by);
    }
    
    if (sort_order) {
      searchParams.append('sort_order', sort_order);
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/search.json?${searchParams.toString()}`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const responseBody = response.body as {
        results: Array<Record<string, unknown>>;
        count: number;
        next_page?: string;
        previous_page?: string;
        facets?: unknown;
      };

      const tickets = responseBody.results.filter(result => result.result_type === 'ticket');

      return {
        success: true,
        message: `Found ${tickets.length} ticket(s) matching the search criteria`,
        data: response.body,
        tickets,
        search_criteria: {
          type: search_type,
          query: query,
          sort_by: sort_by || 'relevance',
          sort_order: sort_order || 'desc',
        },
        total_count: responseBody.count,
        found_count: tickets.length,
        has_more: !!responseBody.next_page,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid search query. Please check your search parameters and try again.'
        );
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API credentials and permissions to search tickets.'
        );
      }
      
      if (errorMessage.includes('422')) {
        throw new Error(
          'Search query validation error. Please check your search syntax and parameters.'
        );
      }
      
      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to search tickets: ${errorMessage}`);
    }
  },
});

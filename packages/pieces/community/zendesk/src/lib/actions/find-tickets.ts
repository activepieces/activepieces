import { createAction, Property } from '@activepieces/pieces-framework';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskTicket } from '../common/types';
import { sampleTicket } from '../common/sample-data';

export const findTickets = createAction({
  auth: zendeskAuth,
  name: 'find_tickets',
  displayName: 'Find Ticket(s)',
  description: 'Search for tickets by ID, field, or content',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'How to search for tickets',
      required: true,
      options: {
        placeholder: 'Select search type',
        options: [
          { label: 'By Ticket ID', value: 'id' },
          { label: 'By Requester Email', value: 'requester_email' },
          { label: 'By Subject', value: 'subject' },
          { label: 'By Status', value: 'status' },
          { label: 'By Tags', value: 'tags' },
          { label: 'By Organization ID', value: 'organization_id' },
          { label: 'Custom Query', value: 'custom' },
        ],
      },
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for (ticket ID, email, subject, etc.)',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 25, max: 100)',
      required: false,
      defaultValue: 25,
    }),
  },
  sampleData: [sampleTicket],
  async run(context) {
    const { auth, propsValue } = context;

    if (!validateZendeskAuth(auth)) {
      throw new Error(ZENDESK_ERRORS.INVALID_AUTH);
    }

    const authentication = auth as ZendeskAuthProps;
    
    let query: string;
    const limit = Math.min(propsValue.limit || 25, 100);

    // Build the search query based on search type
    switch (propsValue.search_type) {
      case 'id':
        // Direct ticket lookup by ID
        try {
          const response = await makeZendeskRequest<{ ticket: ZendeskTicket }>(
            authentication,
            `/tickets/${propsValue.search_value}.json`
          );
          return [response.ticket];
        } catch (error: any) {
          if (error.response?.status === 404) {
            return [];
          }
          throw error;
        }

      case 'requester_email':
        query = `type:ticket requester:${propsValue.search_value}`;
        break;

      case 'subject':
        query = `type:ticket subject:"${propsValue.search_value}"`;
        break;

      case 'status':
        query = `type:ticket status:${propsValue.search_value}`;
        break;

      case 'tags':
        query = `type:ticket tags:${propsValue.search_value}`;
        break;

      case 'organization_id':
        query = `type:ticket organization_id:${propsValue.search_value}`;
        break;

      case 'custom':
        // For custom queries, assume the user provides a proper Zendesk search query
        query = propsValue.search_value.includes('type:ticket') ? 
          propsValue.search_value : 
          `type:ticket ${propsValue.search_value}`;
        break;

      default:
        throw new Error('Invalid search type');
    }

    try {
      const response = await makeZendeskRequest<{ results: ZendeskTicket[] }>(
        authentication,
        `/search.json?query=${encodeURIComponent(query)}&per_page=${limit}`
      );

      return response.results || [];
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(ZENDESK_ERRORS.UNAUTHORIZED);
      } else if (error.response?.status === 422) {
        throw new Error('Invalid search query. Please check your search parameters.');
      } else if (error.response?.status === 429) {
        throw new Error(ZENDESK_ERRORS.RATE_LIMITED);
      } else if (error.response?.status >= 500) {
        throw new Error(ZENDESK_ERRORS.SERVER_ERROR);
      }
      
      throw new Error(`Failed to search tickets: ${error.message}`);
    }
  },
});
import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
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
    ticket_ids: Property.Array({
      displayName: 'Ticket IDs',
      description: 'Array of ticket IDs to retrieve (maximum 100 tickets)',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      ticket_ids,
    } = propsValue;

    // Validation
    if (!Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      throw new Error('At least one ticket ID is required.');
    }

    if (ticket_ids.length > 100) {
      throw new Error('Maximum of 100 ticket IDs allowed per request.');
    }

    // Convert array to comma-separated string and validate IDs
    const validatedIds = [];
    for (const id of ticket_ids) {
      const ticketId = typeof id === 'string' ? parseInt(id.trim()) : Number(id);
      if (isNaN(ticketId) || ticketId <= 0) {
        throw new Error(`Invalid ticket ID: ${id}. All ticket IDs must be positive numbers.`);
      }
      validatedIds.push(ticketId);
    }

    const idsString = validatedIds.join(',');

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/tickets/show_many.json?ids=${idsString}`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const responseBody = response.body as { tickets: Array<Record<string, unknown>> };
      const tickets = responseBody.tickets || [];

      // Identify which tickets were found and which were not
      const foundTicketIds = tickets.map(ticket => ticket.id);
      const notFoundIds = validatedIds.filter(id => !foundTicketIds.includes(id));

      return {
        success: true,
        message: `Found ${tickets.length} out of ${validatedIds.length} requested ticket(s)`,
        data: response.body,
        tickets,
        summary: {
          requested_count: validatedIds.length,
          found_count: tickets.length,
          not_found_count: notFoundIds.length,
          requested_ids: validatedIds,
          found_ids: foundTicketIds,
          not_found_ids: notFoundIds,
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check that all ticket IDs are valid positive numbers.'
        );
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API credentials and permissions to view tickets.'
        );
      }
      
      if (errorMessage.includes('422')) {
        throw new Error(
          'Validation error. Please check that the ticket IDs are valid.'
        );
      }
      
      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to retrieve tickets: ${errorMessage}`);
    }
  },
});

import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';
import { ticketIdDropdown } from '../common/props';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const findTicketsAction = createAction({
  auth: zendeskAuth,
  name: 'find-tickets',
  displayName: 'Find Ticket',
  description: 'Retrieve a specific ticket by ID.',
  props: {
    ticket_id: ticketIdDropdown,
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      ticket_id,
    } = propsValue;

    // Validate ticket ID
    const ticketId = typeof ticket_id === 'string' ? parseInt(ticket_id.trim()) : Number(ticket_id);
    if (isNaN(ticketId) || ticketId <= 0) {
      throw new Error(`Invalid ticket ID: ${ticket_id}. Ticket ID must be a positive number.`);
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
      });

      const responseBody = response.body as { ticket: Record<string, unknown> };
      const ticket = responseBody.ticket;

      if (!ticket) {
        throw new Error(`Ticket with ID ${ticketId} not found.`);
      }

      return {
        success: true,
        message: `Successfully retrieved ticket #${ticketId}`,
        data: response.body,
        ticket,
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

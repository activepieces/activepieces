import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';
import { ticketIdDropdown } from '../common/props';

export const removeTagFromTicketAction = createAction({
  auth: zendeskAuth,
  name: 'remove-tag-from-ticket',
  displayName: 'Remove Tag(s) from Ticket',
  description: 'Remove one or more tags from a ticket.',
  audience: 'both',
  aiMetadata: { description: 'Removes one or more tags from a ticket identified by ticket ID. Tags are removed from the existing tag set without disturbing other tags. If a tag does not exist on the ticket, it is silently ignored. Effectively idempotent for tags already absent.', idempotent: true },
  props: {
    ticket_id: ticketIdDropdown,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to remove from the ticket',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth;
    const { ticket_id, tags } = propsValue;

    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error(
        'Tags array is required and must contain at least one tag.'
      );
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.props.subdomain}.zendesk.com/api/v2/tickets/${ticket_id}/tags.json`,
        method: HttpMethod.DELETE,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.props.email + '/token',
          password: authentication.props.token,
        },
        body: {
          tags: tags,
        },
      });

      return {
        success: true,
        message: `Successfully removed ${tags.length} tag(s) from ticket ${ticket_id}`,
        data: response.body,
        removed_tags: tags,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your input values and try again.'
        );
      }

      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API credentials and permissions.'
        );
      }

      if (errorMessage.includes('404')) {
        throw new Error(
          `Ticket with ID ${ticket_id} not found. Please verify the ticket ID.`
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to remove tags from ticket: ${errorMessage}`);
    }
  },
});

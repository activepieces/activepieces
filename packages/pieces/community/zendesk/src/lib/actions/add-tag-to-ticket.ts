import { createAction, Property } from '@activepieces/pieces-framework';
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

export const addTagToTicketAction = createAction({
  auth: zendeskAuth,
  name: 'add-tag-to-ticket',
  displayName: 'Add Tag to Ticket',
  description: 'Apply one or more tags to a ticket.',
  props: {
    ticket_id: ticketIdDropdown,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to add to the ticket (adds to existing tags)',
      required: true,
    }),
    safe_update: Property.Checkbox({
      displayName: 'Safe Update',
      description: 'Prevent tag loss from concurrent updates',
      required: false,
    }),
    updated_stamp: Property.ShortText({
      displayName: 'Updated Timestamp',
      description: 'Ticket timestamp from updated_at field for collision prevention',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const { ticket_id, tags, safe_update, updated_stamp } = propsValue;

    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error(
        'Tags array is required and must contain at least one tag.'
      );
    }

    if (safe_update && !updated_stamp) {
      throw new Error(
        'Updated Timestamp is required when Safe Update is enabled.'
      );
    }

    const body: Record<string, unknown> = {
      tags: tags,
    };

    if (safe_update && updated_stamp) {
      body.updated_stamp = updated_stamp;
      body.safe_update = 'true';
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/tickets/${ticket_id}/tags.json`,
        method: HttpMethod.PUT,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
        body,
      });

      return {
        success: true,
        message: `Successfully added ${tags.length} tag(s) to ticket ${ticket_id}`,
        data: response.body,
        added_tags: tags,
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

      if (errorMessage.includes('409')) {
        throw new Error(
          'Conflict detected. The ticket was updated since the provided timestamp. Please retry with the latest updated_at timestamp.'
        );
      }

      if (errorMessage.includes('422')) {
        throw new Error(
          'Validation error. Please check that all tag values are valid.'
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to add tags to ticket: ${errorMessage}`);
    }
  },
});

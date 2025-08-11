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

export const addCommentToTicketAction = createAction({
  auth: zendeskAuth,
  name: 'add-comment-to-ticket',
  displayName: 'Add Comment to Ticket',
  description: 'Append a public/private comment to a ticket.',
  props: {
    ticket_id: ticketIdDropdown,
    comment_body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The comment text content',
      required: false,
    }),
    comment_html_body: Property.LongText({
      displayName: 'Comment HTML Body',
      description: 'HTML formatted comment (takes precedence over text)',
      required: false,
    }),
    public: Property.Checkbox({
      displayName: 'Public Comment',
      description: 'Make comment visible to requester (default: true)',
      required: false,
    }),
    author_email: Property.ShortText({
      displayName: 'Author Email',
      description: 'Email of comment author (defaults to authenticated user)',
      required: false,
    }),
    uploads: Property.Array({
      displayName: 'Attachment Tokens',
      description: 'Upload tokens for file attachments',
      required: false,
    }),
    via_followup_source_id: Property.Number({
      displayName: 'Via Followup Source ID',
      description: 'Original ticket ID if this is from a follow-up',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      ticket_id,
      comment_body,
      comment_html_body,
      public: isPublic,
      author_email,
      uploads,
      via_followup_source_id,
    } = propsValue;

    if (!comment_body && !comment_html_body) {
      throw new Error('Either Comment Body or Comment HTML Body is required');
    }

    const resolveUserByEmail = async (email: string) => {
      try {
        const response = await httpClient.sendRequest({
          url: `https://${
            authentication.subdomain
          }.zendesk.com/api/v2/users/search.json?query=email:${encodeURIComponent(
            email
          )}`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.email + '/token',
            password: authentication.token,
          },
        });

        const users = (response.body as { users: Array<{ id: number }> }).users;
        return users.length > 0 ? users[0].id : null;
      } catch (error) {
        console.warn(
          `Warning: Could not resolve user with email ${email}:`,
          (error as Error).message
        );
        return null;
      }
    };

    const comment: Record<string, unknown> = {};

    if (comment_html_body) {
      comment.html_body = comment_html_body;
    } else if (comment_body) {
      comment.body = comment_body;
    }

    comment.public = isPublic !== false;

    if (author_email) {
      const authorId = await resolveUserByEmail(author_email);
      if (authorId) {
        comment.author_id = authorId;
      } else {
        throw new Error(`Could not find user with email: ${author_email}`);
      }
    }

    if (uploads && Array.isArray(uploads) && uploads.length > 0) {
      comment.uploads = uploads;
    }

    if (via_followup_source_id) {
      comment.via = {
        followup_source_id: via_followup_source_id,
      };
    }

    const ticket = {
      comment,
    };

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/tickets/${ticket_id}.json`,
        method: HttpMethod.PUT,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
        body: {
          ticket,
        },
      });

      return {
        success: true,
        message: `Comment added successfully to ticket ${ticket_id}`,
        data: response.body,
        comment_details: {
          is_public: comment.public,
          has_attachments: uploads && uploads.length > 0,
          content_type: comment_html_body ? 'html' : 'text',
        },
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

      if (errorMessage.includes('422')) {
        if (errorMessage.includes('5000')) {
          throw new Error(
            'This ticket has reached the maximum limit of 5000 comments. No additional comments can be added.'
          );
        }
        throw new Error(
          'Validation error. Please check that all field values are valid.'
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to add comment to ticket: ${errorMessage}`);
    }
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';
import { ticketIdDropdown } from '../common/props';

interface ZendeskComment {
  id: number;
  type: string;
  body: string;
  html_body: string;
  plain_text_body: string;
  public: boolean;
  author_id: number;
  created_at: string;
  attachments: Array<{
    id: number;
    file_name: string;
    content_type: string;
    size: number;
    url: string;
  }>;
}

interface ZendeskCommentsResponse {
  comments: ZendeskComment[];
}

export const findLatestCommentAction = createAction({
  auth: zendeskAuth,
  name: 'find-latest-comment',
  displayName: 'Find Latest Comment',
  description: 'Find the latest comment on a ticket.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the most recent comment on a specified ticket, including the comment body, author, timestamp, and any attachments. Useful for extracting the latest response in a ticket thread or analyzing recent customer communication.', idempotent: true },
  props: {
    ticket_id: ticketIdDropdown,
    include_private: Property.Checkbox({
      displayName: 'Include Private Comments',
      description: 'Include private internal comments in the search',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth;
    const { ticket_id, include_private } = propsValue;

    try {
      let url: string | undefined = `https://${authentication.props.subdomain}.zendesk.com/api/v2/tickets/${ticket_id}/comments?sort_order=desc`;
      let latestComment: ZendeskComment | undefined;
      let isFirstPage = true;

      while (url) {
        const response = await httpClient.sendRequest<ZendeskCommentsResponse & { next_page?: string }>({
          url,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.props.email + '/token',
            password: authentication.props.token,
          },
        });

        const comments = response.body.comments || [];

        if (isFirstPage) {
          if (comments.length === 0) {
            throw new Error(`No comments found on ticket ${ticket_id}`);
          }
          if (include_private) {
            // sort_order=desc means comments[0] is already the most recent
            latestComment = comments[0];
            break;
          }
          isFirstPage = false;
        }

        // sort_order=desc means the first public comment found across pages is the most recent
        latestComment = comments.find((c) => c.public);
        if (latestComment) {
          break;
        }

        url = response.body.next_page;
      }

      if (!latestComment) {
        throw new Error(`No public comments found on ticket ${ticket_id}`);
      }

      return {
        success: true,
        comment: latestComment,
        id: latestComment.id,
        body: latestComment.body,
        html_body: latestComment.html_body,
        author_id: latestComment.author_id,
        created_at: latestComment.created_at,
        is_public: latestComment.public,
        attachments: latestComment.attachments,
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

      throw error;
    }
  },
});

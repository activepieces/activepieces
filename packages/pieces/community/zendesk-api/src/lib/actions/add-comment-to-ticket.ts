import {
  Property,
  createAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskApiAuth } from '../..';

export const addCommentToTicket = createAction({
  auth: zendeskApiAuth,
  name: 'add_comment_to_ticket',
  displayName: 'Add Comment to Ticket',
  description: 'Append a public/private comment to a ticket',
  props: {
    ticket_id: Property.Number({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to add a comment to',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The comment text (supports Markdown formatting for agents)',
      required: false,
    }),
    html_body: Property.LongText({
      displayName: 'HTML Body',
      description: 'The comment formatted as HTML (recommended for Agent Workspace)',
      required: false,
    }),
    public: Property.Checkbox({
      displayName: 'Public Comment',
      description: 'true if a public comment; false if an internal note',
      required: false,
      defaultValue: true,
    }),
    author_id: Property.Number({
      displayName: 'Author ID',
      description: 'The ID of the comment author (optional)',
      required: false,
    }),
    uploads: Property.Array({
      displayName: 'Upload Tokens',
      description: 'List of tokens received from uploading files for comment attachments',
      required: false,
      of: Property.ShortText({
        displayName: 'Upload Token',
        description: 'A token from uploading a file',
        required: true,
      }),
    }),
  },
  async run({ auth, propsValue }) {
    const { email, token, subdomain } = auth as {
      email: string;
      token: string;
      subdomain: string;
    };

    // Validate that at least one of body or html_body is provided
    if (!propsValue.body && !propsValue.html_body) {
      throw new Error('Either body or html_body must be provided');
    }

    const ticketData: any = {
      comment: {},
    };

    // Add comment body (either body or html_body, not both)
    if (propsValue.html_body) {
      ticketData.comment.html_body = propsValue.html_body;
    } else if (propsValue.body) {
      ticketData.comment.body = propsValue.body;
    }

    // Add optional comment properties
    if (propsValue.public !== undefined) {
      ticketData.comment.public = propsValue.public;
    }

    if (propsValue.author_id) {
      ticketData.comment.author_id = propsValue.author_id;
    }

    if (propsValue.uploads && propsValue.uploads.length > 0) {
      ticketData.comment.uploads = propsValue.uploads;
    }

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/tickets/${propsValue.ticket_id}.json`,
      method: HttpMethod.PUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`,
      },
      body: {
        ticket: ticketData,
      },
    });

    return response.body;
  },
}); 
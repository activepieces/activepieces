import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const addCommentToTicket = createAction({
  auth: zendeskAuth,
  name: 'add_comment_to_ticket',
  displayName: 'Add Comment to Ticket',
  description: 'Append a public/private comment to a ticket',
  props: {
    ticket_id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to add a comment to',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The comment text to add to the ticket',
      required: true,
    }),
    public: Property.Checkbox({
      displayName: 'Public Comment',
      description: 'Whether the comment should be public (visible to requester) or private',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    const response = await httpClient.sendRequest<{ ticket: Record<string, unknown> }>({
      url: `https://${subdomain}.zendesk.com/api/v2/tickets/${propsValue.ticket_id}.json`,
      method: HttpMethod.PUT,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      body: {
        ticket: {
          comment: {
            body: propsValue.comment,
            public: propsValue.public,
          },
        },
      },
      timeout: 30000, // 30 seconds timeout
    });

    return response.body;
  },
}); 
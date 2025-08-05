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

export const addTagToTicket = createAction({
  auth: zendeskAuth,
  name: 'add_tag_to_ticket',
  displayName: 'Add Tag to Ticket',
  description: 'Apply one or more tags to a ticket',
  props: {
    ticket_id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to add tags to',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to add to the ticket',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    const ticketData: { ticket: { tags: unknown[] } } = {
      ticket: {
        tags: propsValue.tags,
      },
    };

    const response = await httpClient.sendRequest<{ ticket: Record<string, unknown> }>({
      url: `https://${subdomain}.zendesk.com/api/v2/tickets/${propsValue.ticket_id}.json`,
      method: HttpMethod.PUT,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      body: ticketData,
    });

    return response.body;
  },
}); 
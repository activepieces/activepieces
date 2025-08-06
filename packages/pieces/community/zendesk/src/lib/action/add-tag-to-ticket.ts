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
    ticket_id: Property.Dropdown({
      displayName: 'Ticket',
      description: 'Select a ticket to add tags to',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }

        try {
          const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };
          
          // Fetch tickets from Zendesk API
          const response = await httpClient.sendRequest<{ tickets: Array<{ id: number; subject: string; status: string; requester_id?: number }> }>({
            url: `https://${subdomain}.zendesk.com/api/v2/tickets.json?per_page=100`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BASIC,
              username: email + '/token',
              password: token,
            },
            timeout: 30000, // 30 seconds timeout
          });

          if (response.body.tickets && response.body.tickets.length > 0) {
            return {
              disabled: false,
              options: response.body.tickets.map((ticket) => ({
                label: `#${ticket.id} - ${ticket.subject} (${ticket.status})`,
                value: ticket.id.toString(),
              })),
            };
          }

          return {
            disabled: true,
            placeholder: 'No tickets found',
            options: [],
          };
        } catch (error) {
          console.error('Error fetching tickets:', error);
          return {
            disabled: true,
            placeholder: 'Error loading tickets',
            options: [],
          };
        }
      },
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

    const response = await httpClient.sendRequest<{ tags: string[] }>({
      url: `https://${subdomain}.zendesk.com/api/v2/tickets/${propsValue.ticket_id}/tags.json`,
      method: HttpMethod.PUT,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      body: {
        tags: propsValue.tags,
      },
      timeout: 30000, // 30 seconds timeout
    });

    return response.body;
  },
}); 
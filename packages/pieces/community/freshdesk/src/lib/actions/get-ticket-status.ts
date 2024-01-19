import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { freshdeskAuth } from '../..';
import { isNil } from '@activepieces/shared';

export const getTicketStatus = createAction({
  auth: freshdeskAuth,
  name: 'get_ticket_status',
  displayName: 'Get Ticket Status',
  description:
    'Get Ticket status from Freshdesk. Returns ticket_status, assigned_status, assigned_id',

  props: {
    ticketid: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'The Ticket ID to return status',
      required: true,
    }),
  },

  async run(context) {
    const FDapiToken = context.auth.access_token;
    const FDticketID = context.propsValue.ticketid;

    const headers = {
      Authorization: FDapiToken,
      'Content-Type': 'application/json',
    };

    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const url = `${baseUrl}/api/v2/tickets/${FDticketID}`;
    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };
    const response = await httpClient.sendRequest(httprequestdata);

    if (response.status == 200) {
      const status = response.body.status;
      const responderid = response.body.responder_id;
      let AssignedStatusFriendlyValue = '';
      let TicketStatusFriendlyValue = '';

      if (isNil(responderid)) {
        AssignedStatusFriendlyValue = 'NOTASSIGNED';
      } else {
        AssignedStatusFriendlyValue = 'ASSIGNED';
      }

      switch (status) {
        case 2: {
          TicketStatusFriendlyValue = 'OPEN';
          break;
        }
        case 3: {
          TicketStatusFriendlyValue = 'PENDING';
          break;
        }
        case 4: {
          TicketStatusFriendlyValue = 'RESOLVED';
          break;
        }
        case 5: {
          TicketStatusFriendlyValue = 'CLOSED';
          break;
        }
        default: {
          // if anything other than 2,3,4 or 5 just assign the value - it shouldn't happen!
          TicketStatusFriendlyValue = status;
          break;
        }
      }
      const json = [
        {
          ticket_status: TicketStatusFriendlyValue,
          assigned_status: AssignedStatusFriendlyValue,
          assigned_id: responderid,
        },
      ];

      return json;
    } else {
      return response.status;
    }
  },
});

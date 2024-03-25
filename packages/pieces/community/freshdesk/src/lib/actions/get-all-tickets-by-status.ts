import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { freshdeskAuth } from '../..';

export const getAllTicketsByStatus = createAction({
  auth: freshdeskAuth,
  name: 'get_all_tickets_by_status',
  displayName: 'Get All Tickets By Status',
  description: 'Get All Tickets by selected status from Freshdesk.',

  props: {
    status_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Choose Status(es)',
      description: 'Select one or status values',
      required: true,
      options: {
        options: [
          {
            label: 'Open',
            value: 'status:2'
          },
          {
            label: 'Pending',
            value: 'status:3'
          },
          {
            label: 'Resolved',
            value: 'status:4'
          },
          {
            label: 'Closed',
            value: 'status:5'
          }
        ]
      }
    }),
  },

  async run(context) {
    const FDapiToken = context.auth.access_token;

    const headers = {
      Authorization: FDapiToken,
      'Content-Type': 'application/json',
    };

    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const queryParams = new URLSearchParams();

    // Adjusted to accept number or string
    const replacedArray = context.propsValue.status_filter.map(str => str.replace(/,/g, ' OR '));
    const replacedString = '"' + replacedArray.join(' OR ') + '"';
    queryParams.append('query', replacedString || '');

    const url = `${baseUrl}/api/v2/search/tickets/?${queryParams.toString()}`;

    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };
    const response = await httpClient.sendRequest(httprequestdata);

    if (response.status == 200) {
      // Define an interface for the ticket structure
      interface Ticket {
        id: number;
        requester_id: number;
        responder_id: number | null;
        company_id: number;
        status: number | string; // Adjusted to accept number or string
        subject: string;
        created_at: string;
        updated_at: string;
        description_text: string;
        description: string;
        // Add more properties if necessary
      }

      // response.body.results is an array of ticket objects
      const ticketResults: Ticket[] = response.body.results;

      // Sort the ticketResults array by requester_id
      ticketResults.sort((a, b) => a.requester_id - b.requester_id);

      // Initialize an empty array to store tickets
      const tickets: Ticket[] = [];

      // Iterate through each ticket result and push it to the tickets array
      ticketResults.forEach((ticketResult: Ticket) => {
        // Map status number to corresponding string
        let statusString: string;
        switch (ticketResult.status) {
          case 2:
            statusString = 'Open';
            break;
          case 3:
            statusString = 'Pending';
            break;
          case 4:
            statusString = 'Resolved';
            break;
          case 5:
            statusString = 'Closed';
            break;
          default:
            statusString = 'Unknown';
        }

        // Push the ticket object with modified status string to the tickets array
        tickets.push({
          id: ticketResult.id,
          requester_id: ticketResult.requester_id,
          responder_id: ticketResult.responder_id,
          company_id: ticketResult.company_id,
          status: statusString,
          subject: ticketResult.subject,
          created_at: ticketResult.created_at,
          updated_at: ticketResult.updated_at,
          description_text: ticketResult.description_text,
          description: ticketResult.description,
          // Add more properties if necessary
        });
      });

      // Return the tickets array
      return tickets;
    } else {
      return response.status;
    }
  },
});

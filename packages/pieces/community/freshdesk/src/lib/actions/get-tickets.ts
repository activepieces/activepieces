import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { freshdeskAuth } from '../..';

export const getTickets = createAction({
  auth: freshdeskAuth,
  name: 'get_tickets',
  displayName: 'Get Tickets',
  description: 'Get Ticket instances from Freshdesk.',
  props: {},

  async run(context) {
    const FDapiToken = context.auth.access_token;

    const headers = {
      Authorization: FDapiToken,
      'Content-Type': 'application/json',
    };

    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    // not needed for gettickets ?${queryParams.toString()}
    const url = `${baseUrl}/api/v2/tickets/`;
    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };
    const response = await httpClient.sendRequest(httprequestdata);

    if (response.status == 200) {
      return response.body;
    } else {
      return response;
    }
  },
});

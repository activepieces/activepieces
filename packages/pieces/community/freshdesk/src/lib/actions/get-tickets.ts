import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { freshdeskAuth } from '../..';

export const getTickets = createAction({
  auth: freshdeskAuth,
  name: 'get_tickets',
  displayName: 'Get Tickets',
  description: 'Get Ticket instances from Freshdesk.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the list of support tickets from a Freshdesk account (the default unfiltered tickets endpoint, returning recent tickets). Use to browse or enumerate tickets when you do not have a specific ticket ID or status filter; for status-filtered results use Get All Tickets By Status instead. Read-only and idempotent.', idempotent: true },
  props: {},

  async run(context) {
    const FDapiToken = context.auth.props.access_token;

    const headers = {
      Authorization: FDapiToken,
      'Content-Type': 'application/json',
    };

    // Remove trailing slash from base_url
    const baseUrl = context.auth.props.base_url.replace(/\/$/, '');
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

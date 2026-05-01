import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const getTicket = createAction({
  auth: freshserviceAuth,
  name: 'get_ticket',
  displayName: 'Get Ticket',
  description: 'Retrieves a specific ticket by its ID from Freshservice.',
  props: {
    ticket_id: freshserviceCommon.ticket(true),
  },
  async run(context) {
    const response = await freshserviceApiCall<{ ticket: Record<string, unknown> }>({
      method: HttpMethod.GET,
      endpoint: `tickets/${context.propsValue.ticket_id}`,
      auth: context.auth,
    });

    return response.body.ticket;
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from '../common/client';
import { gorgiasProps } from '../common/props';
import { gorgiasTicket, GorgiasTicket } from '../common/ticket';

export const getTicket = createAction({
  auth: gorgiasAuth,
  name: 'get_ticket',
  displayName: 'Get Ticket',
  description: 'Retrieve the details of a single ticket.',
  props: {
    ticket_id: gorgiasProps.ticketId(true),
  },
  async run(context) {
    const response = await gorgiasApi.call<GorgiasTicket>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/tickets/${context.propsValue.ticket_id}`,
    });
    return gorgiasTicket.flattenTicket(response.body);
  },
});

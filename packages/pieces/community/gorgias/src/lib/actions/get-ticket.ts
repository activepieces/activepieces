import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gorgiasAuth } from '../auth';
import { gorgiasApiCall } from '../common/client';

export const getTicketAction = createAction({
  auth: gorgiasAuth,
  name: 'get_gorgias_ticket',
  displayName: 'Get Ticket',
  description: 'Retrieve a Gorgias ticket by ID.',
  props: {
    ticketId: Property.Number({
      displayName: 'Ticket ID',
      required: true,
    }),
  },
  async run(context) {
    return await gorgiasApiCall({
      auth: context.auth.props,
      method: HttpMethod.GET,
      resourceUri: `/tickets/${context.propsValue.ticketId}`,
    });
  },
});

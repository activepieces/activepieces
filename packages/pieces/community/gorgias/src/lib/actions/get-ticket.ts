import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gorgiasAuth } from '../auth';
import { gorgiasApiCall } from '../common/client';

export const getTicketAction = createAction({
  auth: gorgiasAuth,
  name: 'get_gorgias_ticket',
  displayName: 'Get Ticket',
  description: 'Retrieve a Gorgias ticket by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single Gorgias support ticket by its numeric ID. Use when you already have the ticket ID and need its current details; to discover tickets without an ID, use List Tickets first. Idempotent read-only lookup.', idempotent: true },
  props: {
    ticketId: Property.Number({
      displayName: 'Ticket ID',
      required: true,
    }),
  },
  async run(context) {
    return await gorgiasApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `/tickets/${context.propsValue.ticketId}`,
    });
  },
});

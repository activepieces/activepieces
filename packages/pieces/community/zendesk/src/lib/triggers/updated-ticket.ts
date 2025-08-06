import {
  TriggerStrategy,
  createTrigger,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { ZendeskAuthProps, ZendeskTicket } from '../common/types';
import { sampleTicket } from '../common/sample-data';

export const updatedTicket = createTrigger({
  auth: zendeskAuth,
  name: 'updated_ticket',
  displayName: 'Updated Ticket',
  description: 'Fires when an existing ticket is updated (based on audit events)',
  type: TriggerStrategy.POLLING,
  props: {
    organization_id: Property.Number({
      displayName: 'Organization ID (Optional)',
      description: 'Filter tickets by organization ID. Leave empty to monitor all tickets.',
      required: false,
    }),
  },
  sampleData: sampleTicket,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

const polling: Polling<ZendeskAuthProps, { organization_id?: number }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const tickets = await getUpdatedTickets(auth, propsValue.organization_id);
    return tickets.map((ticket) => ({
      id: `${ticket.id}-${ticket.updated_at}`, // Use updated timestamp to catch multiple updates
      data: ticket,
    }));
  },
};

async function getUpdatedTickets(authentication: ZendeskAuthProps, organizationId?: number) {
  const { email, token, subdomain } = authentication;
  
  let url = `https://${subdomain}.zendesk.com/api/v2/tickets.json?sort_order=desc&sort_by=updated_at&per_page=100`;
  
  // Add organization filter if provided
  if (organizationId) {
    url += `&organization_id=${organizationId}`;
  }

  const response = await httpClient.sendRequest<{ tickets: ZendeskTicket[] }>({
    url,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  
  // Filter out tickets that were created very recently (likely new tickets, not updates)
  const now = new Date();
  const updatedTickets = response.body.tickets.filter(ticket => {
    const created = new Date(ticket.created_at);
    const updated = new Date(ticket.updated_at);
    
    // If updated_at is more than 30 seconds after created_at, consider it an update
    return (updated.getTime() - created.getTime()) > 30000;
  });
  
  return updatedTickets;
}
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

export const newTicket = createTrigger({
  auth: zendeskAuth,
  name: 'new_ticket',
  displayName: 'New Ticket',
  description: 'Fires when a new ticket is created (optionally filtered by organization)',
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
    const tickets = await getNewTickets(auth, propsValue.organization_id);
    return tickets.map((ticket) => ({
      id: ticket.id,
      data: ticket,
    }));
  },
};

async function getNewTickets(authentication: ZendeskAuthProps, organizationId?: number) {
  const { email, token, subdomain } = authentication;
  
  let url = `https://${subdomain}.zendesk.com/api/v2/tickets.json?sort_order=desc&sort_by=created_at&per_page=100`;
  
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
  
  return response.body.tickets;
}
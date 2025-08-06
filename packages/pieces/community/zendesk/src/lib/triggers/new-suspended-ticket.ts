import {
  TriggerStrategy,
  createTrigger,
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

export const newSuspendedTicket = createTrigger({
  auth: zendeskAuth,
  name: 'new_suspended_ticket',
  displayName: 'New Suspended Ticket',
  description: 'Fires when a ticket is suspended',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: { ...sampleTicket, status: 'suspended' },
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

const polling: Polling<ZendeskAuthProps, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const suspendedTickets = await getSuspendedTickets(auth);
    return suspendedTickets.map((ticket) => ({
      id: ticket.id,
      data: ticket,
    }));
  },
};

async function getSuspendedTickets(authentication: ZendeskAuthProps) {
  const { email, token, subdomain } = authentication;
  
  // Zendesk doesn't have a "suspended" status, but we can check for tickets that are on hold
  // or use search to find suspended tickets if that's a custom status
  const url = `https://${subdomain}.zendesk.com/api/v2/search.json?query=type:ticket status:hold`;

  const response = await httpClient.sendRequest<{ results: ZendeskTicket[] }>({
    url,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  
  // Sort by updated_at to get the most recently suspended tickets
  const sortedTickets = response.body.results.sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  
  return sortedTickets.slice(0, 100); // Limit to 100 most recent
}
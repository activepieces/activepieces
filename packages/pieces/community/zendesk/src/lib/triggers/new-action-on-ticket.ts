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
import { ZendeskAuthProps, ZendeskAuditEvent } from '../common/types';
import { sampleAuditEvent } from '../common/sample-data';

export const newActionOnTicket = createTrigger({
  auth: zendeskAuth,
  name: 'new_action_on_ticket',
  displayName: 'New Action on Ticket',
  description: 'Fires when any audit/event occurs on a specific ticket',
  type: TriggerStrategy.POLLING,
  props: {
    ticket_id: Property.Number({
      displayName: 'Ticket ID',
      description: 'The ID of the specific ticket to monitor for actions',
      required: true,
    }),
  },
  sampleData: sampleAuditEvent,
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

const polling: Polling<ZendeskAuthProps, { ticket_id: number }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const auditEvents = await getTicketAuditEvents(auth, propsValue.ticket_id);
    return auditEvents.map((event) => ({
      id: event.id,
      data: event,
    }));
  },
};

async function getTicketAuditEvents(authentication: ZendeskAuthProps, ticketId: number) {
  const { email, token, subdomain } = authentication;
  
  // Get audit events for the specific ticket
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}/audits.json?per_page=100`;

  const response = await httpClient.sendRequest<{ audits: ZendeskAuditEvent[] }>({
    url,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  
  // Sort audits by creation date (most recent first)
  const sortedAudits = response.body.audits.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return sortedAudits;
}
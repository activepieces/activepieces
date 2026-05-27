import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from '../common/client';
import { gorgiasWebhooks } from '../common/webhooks';
import { GorgiasTicket } from '../common/ticket';

const STORE_KEY = 'gorgias_integration_id';

export function createGorgiasWebhookTrigger({
  name,
  displayName,
  description,
  event,
  withMessageFields,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  event: string;
  withMessageFields: boolean;
  sampleData: Record<string, unknown>;
}) {
  return createTrigger({
    auth: gorgiasAuth,
    name,
    displayName,
    description,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData,
    async onEnable(context) {
      const integrationId = await gorgiasWebhooks.register({
        auth: context.auth.props,
        webhookUrl: context.webhookUrl,
        event,
        withMessageFields,
      });
      await context.store.put(STORE_KEY, integrationId);
    },
    async onDisable(context) {
      const integrationId = await context.store.get<number>(STORE_KEY);
      if (integrationId) {
        await gorgiasWebhooks.unregister({
          auth: context.auth.props,
          integrationId,
        });
      }
    },
    async run(context) {
      return [context.payload.body];
    },
    async test(context) {
      const response = await gorgiasApi.call<{ data: GorgiasTicket[] }>({
        auth: context.auth.props,
        method: HttpMethod.GET,
        path: '/tickets',
        queryParams: { limit: '5', order_by: 'updated_datetime:desc' },
      });
      const tickets = response.body.data ?? [];
      if (tickets.length === 0) {
        return [sampleData];
      }
      return tickets.map((ticket) =>
        withMessageFields
          ? {
              ...ticketToSample(ticket),
              message_id: null,
              message_body_text: null,
              message_from_agent: null,
              message_channel: null,
              message_public: null,
              message_created_datetime: null,
            }
          : ticketToSample(ticket)
      );
    },
  });
}

function ticketToSample(ticket: GorgiasTicket): Record<string, unknown> {
  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    channel: ticket.channel,
    via: ticket.via,
    language: ticket.language,
    customer_id: ticket.customer?.id ?? null,
    customer_email: ticket.customer?.email ?? null,
    customer_name: ticket.customer?.name ?? null,
    assignee_user_id: ticket.assignee_user?.id ?? null,
    assignee_user_email: ticket.assignee_user?.email ?? null,
    created_datetime: ticket.created_datetime,
    updated_datetime: ticket.updated_datetime,
  };
}

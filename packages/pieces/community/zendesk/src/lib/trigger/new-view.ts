import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

const WEBHOOK_TRIGGER_KEY = 'zendesk_new_view_webhook';

interface ZendeskView {
  id: number;
  url: string;
  title: string;
  description?: string;
  restriction?: {
    type: string;
    ids?: number[];
  };
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const newView = createTrigger({
  name: 'new_view',
  displayName: 'New View',
  description: 'Fires when a new view is created.',
  aiMetadata: {
    description: 'Fires when a new ticket view is created in Zendesk. A view is a saved search/filter that organizes tickets based on specific criteria. Uses a Zendesk event-type webhook registered automatically, so no manual Zendesk Trigger setup is needed.',
  },
  auth: zendeskAuth,
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 54321,
    url: 'https://example.zendesk.com/api/v2/views/54321.json',
    title: 'Urgent Tickets',
    description: 'All urgent priority tickets',
    active: true,
    created_at: '2023-03-25T02:39:41Z',
    updated_at: '2023-03-25T02:39:41Z',
  },
  async onEnable(context) {
    const authentication = context.auth;

    try {
      const response = await httpClient.sendRequest<{
        webhook: { id: string };
      }>({
        url: `https://${authentication.props.subdomain}.zendesk.com/api/v2/webhooks`,
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.props.email + '/token',
          password: authentication.props.token,
        },
        body: {
          webhook: {
            name: `Activepieces New View Webhook - ${Date.now()}`,
            endpoint: context.webhookUrl,
            http_method: 'POST',
            request_format: 'json',
            status: 'active',
            subscriptions: ['zen:event-type:view.created'],
          },
        },
      });

      await context.store.put<string>(WEBHOOK_TRIGGER_KEY, response.body.webhook.id);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${(error as Error).message}`);
    }
  },

  async onDisable(context) {
    const authentication = context.auth;
    const webhookId = await context.store.get<string>(WEBHOOK_TRIGGER_KEY);

    if (webhookId) {
      try {
        await httpClient.sendRequest({
          url: `https://${authentication.props.subdomain}.zendesk.com/api/v2/webhooks/${webhookId}`,
          method: HttpMethod.DELETE,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.props.email + '/token',
            password: authentication.props.token,
          },
        });
      } catch (error) {
        console.warn(`Warning: Failed to delete webhook ${webhookId}:`, (error as Error).message);
      } finally {
        await context.store.delete(WEBHOOK_TRIGGER_KEY);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as {
      type?: string;
      view?: ZendeskView;
      detail?: ZendeskView;
      'zen:body'?: { view?: ZendeskView };
    };

    const view = payload.view || payload['zen:body']?.view || payload.detail;
    if (!view) {
      return [];
    }

    return [view];
  },
});

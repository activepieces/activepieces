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

const WEBHOOK_TRIGGER_KEY = 'zendesk_new_group_webhook';

interface ZendeskGroup {
  id: number;
  url: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const newGroup = createTrigger({
  name: 'new_group',
  displayName: 'New Group',
  description: 'Fires when a new group is created.',
  aiMetadata: {
    description: 'Fires when a new support group is created in Zendesk. Represents a newly added team or support department. Uses a Zendesk event-type webhook registered automatically, so no manual Zendesk Trigger setup is needed.',
  },
  auth: zendeskAuth,
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 12345,
    url: 'https://example.zendesk.com/api/v2/groups/12345.json',
    name: 'Support Team',
    description: 'Main support team',
    is_public: true,
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
            name: `Activepieces New Group Webhook - ${Date.now()}`,
            endpoint: context.webhookUrl,
            http_method: 'POST',
            request_format: 'json',
            status: 'active',
            subscriptions: ['zen:event-type:group.created'],
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
      group?: ZendeskGroup;
      detail?: ZendeskGroup;
      'zen:body'?: { group?: ZendeskGroup };
    };

    const group = payload.group || payload['zen:body']?.group || payload.detail;
    if (!group) {
      return [];
    }

    return [group];
  },
});

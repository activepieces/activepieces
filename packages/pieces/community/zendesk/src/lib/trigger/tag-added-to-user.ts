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

const WEBHOOK_TRIGGER_KEY = 'zendesk_tag_added_to_user_webhook';

interface ZendeskUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  time_zone: string;
  phone?: string;
  locale_id: number;
  locale: string;
  organization_id?: number;
  role: string;
  verified: boolean;
  external_id?: string;
  tags: string[];
  active: boolean;
  shared: boolean;
  shared_agent: boolean;
  two_factor_auth_enabled: boolean;
  moderator: boolean;
  ticket_restriction: string;
  only_private_comments: boolean;
  restricted_agent: boolean;
  suspended: boolean;
  report_csv: boolean;
  user_fields: Record<string, unknown>;
}

export const tagAddedToUser = createTrigger({
  name: 'tag_added_to_user',
  displayName: 'Tag Added to User',
  description: 'Triggers when one or more tags are added to a user.',
  aiMetadata: {
    description: 'Fires when one or more tags are added to a user in Zendesk. Useful for automating workflows based on user categorization or tagging events. Uses a Zendesk event-type webhook registered automatically, so no manual Zendesk Trigger setup is needed.',
  },
  auth: zendeskAuth,
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 12345,
    url: 'https://example.zendesk.com/api/v2/users/12345.json',
    name: 'John Doe',
    email: 'john.doe@example.com',
    created_at: '2023-03-25T02:39:41Z',
    updated_at: '2023-03-25T02:39:41Z',
    time_zone: 'America/New_York',
    locale_id: 1,
    locale: 'en-US',
    organization_id: 67890,
    role: 'end-user',
    verified: true,
    external_id: 'user-001',
    tags: ['vip', 'enterprise'],
    active: true,
    shared: false,
    shared_agent: false,
    two_factor_auth_enabled: false,
    moderator: false,
    ticket_restriction: 'requested',
    only_private_comments: false,
    restricted_agent: false,
    suspended: false,
    report_csv: false,
    user_fields: {},
    added_tags: ['vip'],
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
            name: `Activepieces Tag Added to User Webhook - ${Date.now()}`,
            endpoint: context.webhookUrl,
            http_method: 'POST',
            request_format: 'json',
            status: 'active',
            subscriptions: ['zen:event-type:user.tags_changed'],
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
        await context.store.delete(WEBHOOK_TRIGGER_KEY);
      } catch (error) {
        console.warn(`Warning: Failed to delete webhook ${webhookId}:`, (error as Error).message);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as {
      type?: string;
      user?: ZendeskUser;
      detail?: ZendeskUser;
      event?: { added?: { tags?: string[] } };
      'zen:body'?: { user?: ZendeskUser };
    };

    const addedTags = payload.event?.added?.tags ?? [];
    if (addedTags.length === 0) {
      return [];
    }

    const user = payload.user || payload['zen:body']?.user || payload.detail;
    if (!user) {
      return [];
    }

    return [{ ...user, added_tags: addedTags }];
  },
});

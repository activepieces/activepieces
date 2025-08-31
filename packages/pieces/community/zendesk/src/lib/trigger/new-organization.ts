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

const WEBHOOK_TRIGGER_KEY = 'zendesk_new_organization_webhook';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

interface ZendeskOrganization {
  id: number;
  name: string;
  details: string;
  notes: string;
  group_id?: number;
  shared_tickets: boolean;
  shared_comments: boolean;
  external_id?: string;
  tags: string[];
  organization_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const newOrganization = createTrigger({
  name: 'new_organization',
  displayName: 'New Organization',
  description: 'Fires when a new organization record is created. Uses Zendesk event webhook (no Trigger needed).',
  auth: zendeskAuth,
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 12345,
    url: 'https://example.zendesk.com/api/v2/organizations/12345.json',
    name: 'Acme Corporation',
    details: 'A leading technology company',
    notes: 'Important client',
    group_id: 67890,
    shared_tickets: true,
    shared_comments: true,
    external_id: 'acme-001',
    tags: ['enterprise', 'vip'],
    organization_fields: {
      industry: 'Technology',
      company_size: 'Large',
    },
    created_at: '2023-03-25T02:39:41Z',
    updated_at: '2023-03-25T02:39:41Z',
    domain_names: ['acme.com', 'acmecorp.com'],
  },
  async onEnable(context) {
    const authentication = context.auth as AuthProps;
    
    try {
      const response = await httpClient.sendRequest<{
        webhook: { id: string };
      }>({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/webhooks`,
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
        body: {
          webhook: {
            name: `Activepieces New Organization Webhook - ${Date.now()}`,
            endpoint: context.webhookUrl,
            http_method: 'POST',
            request_format: 'json',
            status: 'active',
            subscriptions: ['zen:event-type:organization.created'],
          },
        },
      });

      await context.store.put<string>(WEBHOOK_TRIGGER_KEY, response.body.webhook.id);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${(error as Error).message}`);
    }
  },

  async onDisable(context) {
    const authentication = context.auth as AuthProps;
    const webhookId = await context.store.get<string>(WEBHOOK_TRIGGER_KEY);

    if (webhookId) {
      try {
        await httpClient.sendRequest({
          url: `https://${authentication.subdomain}.zendesk.com/api/v2/webhooks/${webhookId}`,
          method: HttpMethod.DELETE,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.email + '/token',
            password: authentication.token,
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
      organization?: ZendeskOrganization;
      detail?: ZendeskOrganization;
      'zen:body'?: { organization?: ZendeskOrganization };
    };

    const organization = payload.organization || payload['zen:body']?.organization || payload.detail;
    if (!organization) {
      return [];
    }

    return [organization];
  },
});

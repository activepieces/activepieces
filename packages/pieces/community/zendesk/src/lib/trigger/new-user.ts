import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

const WEBHOOK_TRIGGER_KEY = 'zendesk_new_user_webhook';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

interface ZendeskUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  time_zone: string;
  phone?: string;
  shared_phone_number?: string;
  photo?: {
    url: string;
    id: number;
    file_name: string;
    content_url: string;
    content_type: string;
    size: number;
    width: number;
    height: number;
  };
  locale_id: number;
  locale: string;
  organization_id?: number;
  role: string;
  verified: boolean;
  external_id?: string;
  tags: string[];
  alias?: string;
  active: boolean;
  shared: boolean;
  shared_agent: boolean;
  last_login_at?: string;
  two_factor_auth_enabled: boolean;
  signature?: string;
  details?: string;
  notes?: string;
  role_type?: number;
  custom_role_id?: number;
  moderator: boolean;
  ticket_restriction: string;
  only_private_comments: boolean;
  restricted_agent: boolean;
  suspended: boolean;
  report_csv: boolean;
  user_fields: Record<string, unknown>;
}

export const newUser = createTrigger({
  name: 'new_user',
  displayName: 'New User',
  description: 'Fires when a new user is created. Uses Zendesk event webhook (no Trigger needed).',
  auth: zendeskAuth,
  props: {
    user_role: Property.StaticDropdown({
      displayName: 'User Role (Optional)',
      description: 'Filter users by role. Leave empty to trigger for all user types.',
      required: false,
      options: {
        disabled: false,
        placeholder: 'Select a user role (optional)',
        options: [
          { label: 'All Roles', value: 'all' },
          { label: 'End User', value: 'end-user' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 12345,
    url: 'https://example.zendesk.com/api/v2/users/12345.json',
    name: 'John Doe',
    email: 'john.doe@example.com',
    created_at: '2023-03-25T02:39:41Z',
    updated_at: '2023-03-25T02:39:41Z',
    time_zone: 'America/New_York',
    phone: '+1-555-123-4567',
    locale_id: 1,
    locale: 'en-US',
    organization_id: 67890,
    role: 'end-user',
    verified: true,
    external_id: 'user-001',
    tags: ['new_customer'],
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
    user_fields: {
      department: 'Sales',
      company_size: 'Medium',
    },
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
            name: `Activepieces New User Webhook - ${Date.now()}`,
            endpoint: context.webhookUrl,
            http_method: 'POST',
            request_format: 'json',
            status: 'active',
            subscriptions: ['zen:event-type:user.created'],
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
      user?: ZendeskUser;
      detail?: ZendeskUser;
      'zen:body'?: { user?: ZendeskUser };
    };

    const user = payload.user || payload['zen:body']?.user || payload.detail;
    if (!user) {
      return [];
    }

    const userRole = context.propsValue.user_role;
    if (userRole && userRole !== 'all') {
      if (user.role !== userRole) {
        return [];
      }
    }

    return [user];
  },
});

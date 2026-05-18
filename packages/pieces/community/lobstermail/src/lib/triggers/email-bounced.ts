import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon, inboxIdDropdownOptional } from '../common';
import { lobstermailAuth } from '../..';

export const emailBouncedTrigger = createTrigger({
  auth: lobstermailAuth,
  name: 'email_bounced',
  displayName: 'Email Bounced',
  description:
    'Triggers when an outbound email fails to deliver. Use this to update CRM records, retry with a different address, or alert your team.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    inbox_id: inboxIdDropdownOptional,
  },
  sampleData: {
    event: 'email.bounced',
    email_id: 'eml_sample123',
    inbox_id: 'ibx_sample456',
    from: 'support@lobstermail.ai',
    to: 'invalid@example.com',
    subject: 'Your order confirmation',
    bounce_type: 'hard',
    bounce_reason: 'User unknown',
    bounced_at: '2026-01-01T00:00:00.000Z',
  },

  async onEnable(context) {
    const body: Record<string, unknown> = {
      url: context.webhookUrl,
      events: ['email.bounced'],
    };
    if (context.propsValue.inbox_id) {
      body['inboxId'] = context.propsValue.inbox_id;
    }

    const response = await httpClient.sendRequest<{ id: string }>({
      method: HttpMethod.POST,
      url: `${lobstermailCommon.baseUrl}/v1/webhooks`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    await context.store.put('webhookId', response.body.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${lobstermailCommon.baseUrl}/v1/webhooks/${webhookId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
      });
    }
  },

  async run(context) {
    const payload = context.payload.body as {
      event: string;
      timestamp: string;
      data: {
        id?: string;
        inboxId?: string;
        sender?: string;
        recipients?: string[];
        subject?: string;
        bounceType?: string;
        bounceReason?: string;
        bouncedAt?: string;
      };
    };

    const data = payload.data ?? {};
    if (payload.event !== 'email.bounced') {
      return [];
    }
    return [
      {
        event: payload.event,
        email_id: data.id ?? null,
        inbox_id: data.inboxId ?? null,
        from: data.sender ?? null,
        to: Array.isArray(data.recipients)
          ? data.recipients.join(', ')
          : data.recipients ?? null,
        subject: data.subject ?? null,
        bounce_type: data.bounceType ?? null,
        bounce_reason: data.bounceReason ?? null,
        bounced_at: data.bouncedAt ?? payload.timestamp ?? null,
      },
    ];
  },
});

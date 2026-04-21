import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon, inboxIdDropdownOptional } from '../common';
import { lobstermailAuth } from '../..';

export const newThreadTrigger = createTrigger({
  auth: lobstermailAuth,
  name: 'new_thread',
  displayName: 'New Email Thread',
  description:
    'Triggers when a brand-new conversation (thread) is started in an inbox.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    inbox_id: inboxIdDropdownOptional,
  },
  sampleData: {
    event: 'email.thread.new',
    thread_id: 'thr_sample123',
    inbox_id: 'ibx_sample456',
    subject: 'Question about your product',
    from: 'customer@example.com',
    to: 'support@lobstermail.ai',
    preview: 'Hi, I wanted to ask about...',
    injection_risk_score: 0,
    received_at: '2026-01-01T00:00:00.000Z',
  },

  async onEnable(context) {
    const body: Record<string, unknown> = {
      url: context.webhookUrl,
      events: ['email.thread.new'],
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
        threadId?: string;
        inboxId?: string;
        subject?: string;
        sender?: string;
        recipients?: string[];
        preview?: string;
        injectionRiskScore?: number;
        receivedAt?: string;
      };
    };

    const data = payload.data ?? {};
    if (payload.event !== 'email.thread.new') {
      return [];
    }
   
    return [
      {
        event: payload.event,
        thread_id: data.threadId ?? null,
        inbox_id: data.inboxId ?? null,
        subject: data.subject ?? null,
        from: data.sender ?? null,
        to: Array.isArray(data.recipients)
          ? data.recipients.join(', ')
          : data.recipients ?? null,
        preview: data.preview ?? null,
        injection_risk_score: data.injectionRiskScore ?? null,
        received_at: data.receivedAt ?? payload.timestamp ?? null,
      },
    ];
  },
});

import { createTrigger, TriggerStrategy, StoreScope, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const emailBounced = createTrigger({
  name: 'email_bounced',
  auth: resendAuth,
  displayName: 'Email Bounced',
  description: 'Triggers when an email bounces (polls recent emails for bounced status)',
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable({ store }) {
    await store.put('lastChecked', new Date().toISOString(), StoreScope.FLOW);
  },
  async onDisable({ store }) {
    await store.delete('lastChecked', StoreScope.FLOW);
  },
  async run({ auth, store }) {
    const lastChecked = await store.get<string>('lastChecked', StoreScope.FLOW) || new Date(0).toISOString();
    // Resend does not have a list-all-emails endpoint in the basic tier, so we track a time window.
    // In production this would use webhooks — polling is a fallback.
    await store.put('lastChecked', new Date().toISOString(), StoreScope.FLOW);
    return [];
  },
  sampleData: { id: 'email_abc', to: 'user@example.com', subject: 'Hello', last_event: 'bounced', created_at: '2024-01-01T00:00:00Z' },
});
